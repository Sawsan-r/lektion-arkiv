
# Plan: Fixa Alla Autentiserings- och Kontaktformulärsproblem

## Identifierade Problem

| Problem | Orsak |
|---------|-------|
| **1. Lärarroll tilldelas inte** | Efter `signUp` är användaren inte automatiskt inloggad, så `auth.uid()` returnerar null vid RLS-kontroll |
| **2. Studentroll & klassmedlemskap tilldelas inte** | Samma problem - efterföljande databasoperationer misslyckas tyst |
| **3. Återställningslänk går till localhost** | Supabase kräver att redirect-URL:en är konfigurerad i Dashboard |
| **4. Kontaktformulär ger fel** | Resend-domänen är inte verifierad, vilket begränsar vilka mottagare som kan få e-post |

---

## Lösning 1: Fixa Teacher Invite Flow

**Problem**: När en lärare skapar konto via inbjudan så görs `signUp`, men efterföljande inserts till `user_roles` och `profiles` misslyckas eftersom användaren inte är inloggad ännu.

**Lösning**: Efter `signUp`, logga in användaren automatiskt och vänta på att sessionen är aktiv innan du gör databasoperationer.

### Ändringar i `src/pages/TeacherInvite.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm() || !invitation || !token) return;
  setIsSubmitting(true);

  try {
    // 1. Skapa kontot
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/teacher`,
        data: { full_name: fullName },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Användare kunde inte skapas");

    // 2. Logga in direkt efter signup för att få aktiv session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

    if (signInError) throw signInError;

    // 3. Nu är användaren inloggad - uppdatera profil
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        organization_id: invitation.organization_id,
        full_name: fullName
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // 4. Tilldela lärarrollen
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "teacher",
      });

    if (roleError) {
      console.error("Role insert error:", roleError);
      throw new Error("Kunde inte tilldela lärarroll");
    }

    // 5. Markera inbjudan som använd
    await supabase
      .from("teacher_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    toast({
      title: "Konto skapat!",
      description: "Välkommen som lärare!"
    });

    navigate("/teacher");
  } catch (err: any) {
    console.error("Error creating account:", err);
    toast({
      title: "Fel",
      description: err.message || "Kunde inte skapa kontot",
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Lösning 2: Fixa Student Join Flow

**Problem**: Samma som för lärare - efter `signUp` är användaren inte inloggad.

### Ändringar i `src/pages/JoinClass.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm() || !classData) return;
  setIsSubmitting(true);

  try {
    // 1. Skapa kontot
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/student`,
        data: { full_name: fullName },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        toast({
          title: "Konto finns redan",
          description: "Logga in istället och använd klasskoden för att gå med.",
          variant: "destructive"
        });
        navigate(`/auth?joinCode=${encodeURIComponent(code || '')}`);
        return;
      }
      throw authError;
    }

    if (!authData.user) throw new Error("Användare kunde inte skapas");

    // 2. Logga in direkt efter signup
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    // 3. Tilldela studentrollen
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "student",
      });

    if (roleError) {
      console.error("Role insert error:", roleError);
      throw new Error("Kunde inte tilldela studentroll");
    }

    // 4. Gå med i klassen
    const { error: memberError } = await supabase
      .from("class_members")
      .insert({
        class_id: classData.id,
        student_id: authData.user.id,
      });

    if (memberError) {
      console.error("Class join error:", memberError);
      throw new Error("Kunde inte gå med i klassen");
    }

    toast({
      title: "Välkommen!",
      description: `Du har gått med i ${classData.name}`
    });

    navigate("/student");
  } catch (err: any) {
    console.error("Error creating account:", err);
    toast({
      title: "Fel",
      description: err.message || "Kunde inte skapa kontot",
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Lösning 3: Fixa Password Reset Redirect

**Problem**: Supabase ignorerar `redirectTo` om URL:en inte är vitlistad i Dashboard.

### Åtgärd (manuell konfiguration i Supabase):

Du behöver lägga till din app-URL i Supabase Dashboard:

1. Gå till **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Ställ in **Site URL** till: `https://id-preview--613e4335-ed5a-4a8a-b445-30b3262597b6.lovable.app`
3. Lägg till i **Redirect URLs**:
   - `https://id-preview--613e4335-ed5a-4a8a-b445-30b3262597b6.lovable.app/**`
   - (Och eventuell produktions-URL när den finns)

### Kodändring i `src/pages/Auth.tsx`:

Uppdatera redirect-URL:en till att peka på en dedikerad sida för lösenordsåterställning:

```typescript
const handlePasswordReset = async () => {
  if (!validateForm()) return;
  setIsLoading(true);
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=update-password`,
    });
    if (error) throw error;
    setResetSent(true);
    toast({ 
      title: "E-post skickad!", 
      description: "Kontrollera din inkorg för att återställa lösenordet." 
    });
  } catch (err: any) {
    toast({ 
      title: "Fel", 
      description: err.message || "Kunde inte skicka återställningslänk", 
      variant: "destructive" 
    });
  } finally {
    setIsLoading(false);
  }
};
```

Lägg också till hantering för lösenordsuppdatering i Auth.tsx om `mode=update-password` finns i URL:en.

---

## Lösning 4: Fixa Contact Form Email

**Problem**: Resend kräver en verifierad domän för att skicka e-post till andra mottagare.

### Alternativ A: Verifiera domän i Resend (rekommenderat)

1. Gå till **https://resend.com/domains**
2. Lägg till domänen `notera.info` (eller er domän)
3. Följ DNS-verifieringsstegen
4. Uppdatera edge function att använda den verifierade domänen:

```typescript
// Ändra från:
from: "Notera <onboarding@resend.dev>",

// Till:
from: "Notera <noreply@notera.info>",
```

### Alternativ B: Tillfällig lösning (för testning)

Om domänverifiering tar tid, kan vi temporärt begränsa till att bara skicka till admin-e-posten och skippa bekräftelsemailet till avsändaren.

---

## Sammanfattning av Ändringar

| Fil | Åtgärd |
|-----|--------|
| `src/pages/TeacherInvite.tsx` | Logga in användaren direkt efter signup innan databasoperationer |
| `src/pages/JoinClass.tsx` | Logga in användaren direkt efter signup innan databasoperationer |
| `src/pages/Auth.tsx` | Lägg till hantering för lösenordsuppdatering |
| `supabase/functions/send-contact-form/index.ts` | Uppdatera `from`-adressen till verifierad domän |
| **Supabase Dashboard** | Konfigurera Site URL och Redirect URLs |
| **Resend Dashboard** | Verifiera domänen `notera.info` |

---

## Tekniska Detaljer

### Varför `signUp` inte räcker

När du anropar `supabase.auth.signUp()`:
- Användaren skapas i `auth.users`
- En profil skapas automatiskt via trigger (`handle_new_user`)
- MEN sessionen aktiveras inte automatiskt om e-postbekräftelse är påslagen

Genom att anropa `signInWithPassword()` direkt efter `signUp()`:
- Sessionen aktiveras
- `auth.uid()` returnerar korrekt användar-ID
- RLS-policies fungerar som förväntat
