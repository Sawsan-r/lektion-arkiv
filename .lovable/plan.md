
# Plan: Fixa Problem med Rolltilldelning

## Rotorsaksanalys

Efter noggrann undersökning har jag hittat det faktiska problemet:

### Vad som hände med de drabbade användarna

| Användare | Registrerades | Gick med i klass | Har roll |
|-----------|--------------|------------------|----------|
| Julia Zidane | 2026-01-21 19:28 | ✅ Ja (mate test 1) | ❌ Nej |
| lolo bobo | 2026-01-22 12:49 | ❌ Nej | ❌ Nej |
| Randa | 2026-01-22 19:45 | ❌ Nej | ❌ Nej |

**Notera:** Julia lyckades gå med i en klass men fick ingen roll! Detta är nyckeln till problemet.

### Rotorsaken: Olika RLS-policyer

Jag hittade att RLS-policyerna har olika krav:

| Tabell | Policy | Databas-roll krävs |
|--------|--------|-------------------|
| `class_members` | "Students can join classes" | `{public}` ← Tillåter alla |
| `user_roles` | "Users can insert own student role" | `{authenticated}` ← Kräver autentiserad session |

**Problemet:** När `signUp` körs, även om `signInWithPassword` körs direkt efter, kan det finnas en millisekunds fördröjning innan Postgres-anslutningen uppdateras med den nya JWT-token som har `authenticated` rollen.

- `class_members` insert lyckas eftersom den tillåter `public` roll
- `user_roles` insert misslyckas eftersom den kräver `authenticated` roll

### Varför det inte alltid händer

Beroende på serverbelastning och timing kan sessionen ibland hinna uppdateras, och ibland inte.

---

## Lösning

### Del 1: Fixa RLS-policyn (Databas)

Ändra student-rollpolicyn från att kräva `authenticated` till `public`, precis som de andra policyerna. Säkerheten bibehålls genom `auth.uid()` kontrollen i WITH CHECK.

**Nuvarande policy:**
```sql
CREATE POLICY "Users can insert own student role"
ON public.user_roles
FOR INSERT
TO authenticated  -- ← Problem: kräver authenticated roll
WITH CHECK ((user_id = auth.uid()) AND (role = 'student'::app_role));
```

**Ny policy:**
```sql
DROP POLICY "Users can insert own student role" ON public.user_roles;

CREATE POLICY "Users can insert own student role"
ON public.user_roles
FOR INSERT
TO public  -- ← Ändrad: tillåter public (men auth.uid() krävs fortfarande)
WITH CHECK ((user_id = auth.uid()) AND (role = 'student'::app_role));
```

### Del 2: Lägg till felhantering i koden (Extra säkerhet)

Uppdatera `JoinClass.tsx` och `TeacherInvite.tsx` för att:
1. Kontrollera att sessionen verkligen är etablerad innan databasoperationer
2. Lägga till retry-logik om första försöket misslyckas
3. Visa tydliga felmeddelanden istället för tysta misslyckanden

```text
Nytt flöde:
┌────────────────────────────────────────────┐
│ 1. signUp()                                │
│ 2. signInWithPassword()                    │
│ 3. Kontrollera: supabase.auth.getSession() │
│    ├─ Session finns? → Fortsätt           │
│    └─ Ingen session? → Visa fel           │
│ 4. Insert user_role                        │
│ 5. Insert class_member (om student)        │
└────────────────────────────────────────────┘
```

### Del 3: Fixa befintliga användare (En-gångs SQL)

Kör detta i Supabase SQL Editor för att fixa Julia som redan gått med i en klass:

```sql
-- Tilldela studentroll till användare som gått med i klasser men saknar roll
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT cm.student_id, 'student'::app_role
FROM class_members cm
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = cm.student_id
);
```

---

## Sammanfattning av åtgärder

| Typ | Åtgärd | Vem gör det |
|-----|--------|-------------|
| **Databas** | Uppdatera RLS-policy för student-roll till `public` | Lovable (migration) |
| **Kod** | Lägg till session-verifiering i JoinClass.tsx | Lovable |
| **Kod** | Lägg till session-verifiering i TeacherInvite.tsx | Lovable |
| **Manuellt** | Kör SQL för att fixa Julia (och andra) | Du (i Supabase SQL Editor) |

---

## Tekniska detaljer

### Varför `public` är säkert

RLS-policyn har två lager av kontroll:
1. **TO \<role\>** - Vilken databasroll som får köra frågan
2. **WITH CHECK** - Logik som måste vara sann för att raden ska sparas

Även om vi ändrar till `TO public`, så kräver `WITH CHECK` fortfarande:
- `user_id = auth.uid()` - Användaren måste ange sitt eget ID
- `role = 'student'::app_role` - Kan endast tilldela studentroll

Om någon försöker fuska:
- Utan inloggning: `auth.uid()` returnerar `null`, insert misslyckas
- Fel user_id: `user_id = auth.uid()` blir falskt, insert misslyckas
- Fel roll: `role = 'student'` blir falskt, insert misslyckas

### Filändringar

| Fil | Ändring |
|-----|---------|
| `src/pages/JoinClass.tsx` | Lägg till session-verifiering efter sign in |
| `src/pages/TeacherInvite.tsx` | Samma som ovan |
| **Databasmigration** | Uppdatera RLS-policy för user_roles |
