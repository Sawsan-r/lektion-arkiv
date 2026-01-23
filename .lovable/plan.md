
# Plan: Fixa Testarens Rapporterade Problem

## Sammanfattning av Problem och Lösningar

| Problem | Orsak | Lösning | Prioritet |
|---------|-------|---------|-----------|
| 1. Konton utan roll | Supabase e-postbekräftelse förhindrar direkt inloggning efter signUp | Kolla om `authData.session` finns, annars informera användaren | Hög |
| 2. "Hem" loggar ut | Hem-länken pekar på "/" (landningssidan) | Ändra Hem-länken till respektive dashboard | Hög |
| 3. Lärare kan ej se inspelning | Lektionskorten i ClassLessons är ej klickbara | Lägg till onClick för att navigera till lektionsvyn | Hög |
| 7. Student ser 0 lektioner | Koden filtrerar på `status: "completed"` men lektioner har `status: "ready"` | Ändra filtret till `status: "ready"` | Hög |
| 11. Lösenordsåterställning | Site URL inte konfigurerad i Supabase | Manuell konfiguration krävs | Hög |
| 4. Lärare vill redigera | Funktion saknas | Lägg till redigeringsformulär för sammanfattning | Medel |
| 5. Engelska översätts till svenska | AI-prompten säger "på svenska" alltid | Lägg till språkval vid inspelning | Medel |
| 6. Tidsstämplar före text | AI-quirk | Förbättra AI-prompten | Låg |
| 8. Sparandet tar tid | Normal uppladdning + AI-tid | Kan optimeras senare, inte en bugg | Låg |
| 9. Slider fungerar ej | Slider-komponentens default behavior | Kontrollera Slider-props | Låg |
| 10. Bakgrundsljud | Webbläsar-API begränsning | Informera användaren, ej fixbart i kod | N/A |

---

## Detaljerade Lösningar

### 1. Konton utan roll - Diagnostik och Fix

**Problem:** När e-postbekräftelse är på returnerar `signUp` ingen session direkt.

**Lösning:**
- Kontrollera om `authData.session` är null efter signup
- Om null: visa meddelande att användaren måste bekräfta sin e-post
- Eller: stäng av e-postbekräftelse i Supabase Dashboard (rekommenderas för denna app)

**Filändringar:**
- `src/pages/TeacherInvite.tsx` - Lägg till session-check
- `src/pages/JoinClass.tsx` - Samma ändring

```text
Förändring i handleSubmit:
┌────────────────────────────────────────┐
│ 1. Signup                              │
│ 2. Check if session exists             │
│    ├─ YES: signIn and continue         │
│    └─ NO: Show "bekräfta email" toast  │
└────────────────────────────────────────┘
```

---

### 2. "Hem" loggar ut - Fix

**Problem:** Hem-länken pekar på "/" som är landningssidan, inte dashboarden.

**Lösning:** Ändra Hem-länken i DashboardLayout.tsx till att peka på respektive dashboard baserat på roll.

**Filändringar:**
- `src/components/layout/DashboardLayout.tsx`

```typescript
// Före:
{ title: "Hem", url: "/", icon: Home }

// Efter:
// Ta bort "Hem" från nav och behåll bara dashboard-specifika länkar
// Eller ändra url baserat på roll:
const homeUrl = roles.includes("system_admin") ? "/admin" 
              : roles.includes("teacher") ? "/teacher"
              : roles.includes("student") ? "/student"
              : "/";
```

---

### 3. Lärare kan ej se inspelning - Fix

**Problem:** Lektionskorten i ClassLessons.tsx har ingen onClick-handler.

**Lösning:** Lägg till klickbar navigering till lektionsvyn för lektioner med status "ready".

**Filändringar:**
- `src/pages/teacher/ClassLessons.tsx`

```typescript
// Lägg till onClick på lektionskortet:
<div
  onClick={() => lesson.status === "ready" && navigate(`/teacher/lesson/${lesson.id}`)}
  className={`... ${lesson.status === "ready" ? "cursor-pointer" : ""}`}
>
```

**Ny route behövs:**
- Skapa ny sida `src/pages/teacher/LessonView.tsx` (kan återanvända student-versionen)
- Eller skapa en gemensam route `/lesson/:lessonId` som båda roller kan nå

---

### 4. Lärare vill redigera - Ny Funktion

**Problem:** Läraren kan inte redigera sammanfattningen.

**Lösning:** Lägg till redigeringsläge i lektionsvyn för lärare.

**Filändringar:**
- Skapa/uppdatera `src/pages/teacher/LessonView.tsx` med redigeringsfunktion
- Lägg till en "Redigera"-knapp som öppnar ett textarea-formulär
- Spara ändringar till databasen

---

### 5. Engelska översätts till svenska - Fix

**Problem:** AI-prompten säger alltid "på svenska".

**Lösning:** 
1. Lägg till språkval i RecordLesson.tsx (dropdown: Svenska/Engelska/Annat)
2. Skicka språket till edge function
3. Uppdatera AI-prompten att respektera originalspråket

**Filändringar:**
- `src/pages/teacher/RecordLesson.tsx` - Lägg till språkval
- `supabase/functions/process-lesson/index.ts` - Dynamisk prompt

---

### 6. Tidsstämplar före text - Fix

**Problem:** AI lägger ibland till tidsstämplar.

**Lösning:** Förtydliga i prompten att inga tidsstämplar ska inkluderas.

**Filändringar:**
- `supabase/functions/process-lesson/index.ts`

```typescript
// Lägg till i prompten:
"- Inkludera INGA tidsstämplar (som 'Minut 1:') i transkriptionen"
```

---

### 7. Student ser 0 lektioner - Fix

**Problem:** Koden filtrerar på `status: "completed"` men lektionerna har `status: "ready"`.

**Lösning:** Ändra filtret till `status: "ready"`.

**Filändringar:**
- `src/pages/student/AllLessons.tsx` - rad 68

```typescript
// Före:
.eq("status", "completed")

// Efter:
.eq("status", "ready")
```

**OCKSÅ:**
- `src/pages/student/StudentDashboard.tsx` - rad 83 har samma fel

```typescript
// Före:
.eq("status", "ready") // Denna är redan rätt!
```

Dubbelkolla: StudentDashboard.tsx använder redan "ready", men AllLessons.tsx använder "completed".

---

### 9. Slider fungerar ej för drag - Fix

**Problem:** Slider-komponenten kanske inte hanterar onPointerDown/onPointerMove korrekt.

**Lösning:** Kontrollera att Slider-komponenten från Radix UI är korrekt konfigurerad.

**Filändringar:**
- `src/pages/student/LessonView.tsx` - Testa med explicit cursor-styling

---

### 11. Lösenordsåterställning - Manuell Konfiguration

**Problem:** Redirect URL går till localhost.

**Lösning (MANUELL - kräver användarens åtgärd):**

1. Gå till Supabase Dashboard
2. Navigera till **Authentication → URL Configuration**
3. Ställ in **Site URL**: `https://id-preview--613e4335-ed5a-4a8a-b445-30b3262597b6.lovable.app`
4. Lägg till i **Redirect URLs**: 
   - `https://id-preview--613e4335-ed5a-4a8a-b445-30b3262597b6.lovable.app/**`

---

## Sammanfattning av Filändringar

| Fil | Ändring |
|-----|---------|
| `src/components/layout/DashboardLayout.tsx` | Ändra "Hem"-länken till roll-baserad URL |
| `src/pages/TeacherInvite.tsx` | Lägg till session-check + felmeddelande |
| `src/pages/JoinClass.tsx` | Lägg till session-check + felmeddelande |
| `src/pages/teacher/ClassLessons.tsx` | Gör lektionskort klickbara |
| `src/pages/teacher/LessonView.tsx` | NY FIL - lektionsvy för lärare med redigeringsfunktion |
| `src/pages/student/AllLessons.tsx` | Ändra status-filter till "ready" |
| `src/pages/teacher/RecordLesson.tsx` | Lägg till språkval |
| `supabase/functions/process-lesson/index.ts` | Dynamisk prompt baserad på språk + inga tidsstämplar |
| `src/App.tsx` | Lägg till route för `/teacher/lesson/:lessonId` |

---

## Manuella Åtgärder (Supabase Dashboard)

1. **Lösenordsåterställning:** Konfigurera Site URL och Redirect URLs
2. **E-postbekräftelse:** Överväg att stänga av för smidigare onboarding (valfritt)

---

## Frågor som jag inte kan fixa i kod

| Problem | Anledning |
|---------|-----------|
| Bakgrundsljud i inspelningar | Webbläsarens MediaRecorder API har begränsad ljudisolering |
| Sparandet tar tid | Normal latens för upload + AI, kan optimeras med streaming senare |
