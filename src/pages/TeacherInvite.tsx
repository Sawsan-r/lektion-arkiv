import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Loader2, XCircle, Sparkles, ArrowRight, Lock as LockIcon } from "lucide-react";
import { z } from "zod";
import noteraLogo from "@/assets/notera-logo-white.png";

const passwordSchema = z.string().min(6, "Lösenord måste vara minst 6 tecken");

const TeacherInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [invitation, setInvitation] = useState<{
    email: string;
    organization_name: string;
    organization_id: string;
  } | null>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; fullName?: string }>({});

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_invitations")
        .select("email, organization_id, expires_at, used_at, organizations(name)")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setIsValid(false);
        return;
      }

      if (new Date(data.expires_at) < new Date() || data.used_at) {
        setIsValid(false);
        return;
      }

      setInvitation({
        email: data.email,
        organization_id: data.organization_id,
        organization_name: (data.organizations as { name: string })?.name || "Okänd skola",
      });
      setIsValid(true);
    } catch (err) {
      console.error("Error validating invitation:", err);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Namn krävs";
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Lösenorden matchar inte";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !invitation || !token) return;

    setIsSubmitting(true);

    try {
      // 1. Create the account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/teacher`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Användare kunde inte skapas");

      // 2. Sign in immediately after signup to establish session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });

      if (signInError) {
        console.error("Sign in after signup failed:", signInError);
        toast({
          title: "Sessionsfel",
          description: "Kunde inte logga in efter registrering. Försök logga in manuellt.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      // 3. Verify session is established
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("No session after sign in");
        toast({
          title: "Sessionsfel",
          description: "Kunde inte etablera session. Försök logga in manuellt.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      // 4. Now the user is logged in - update profile with organization
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

      // 5. Assign teacher role (with retry logic)
      let roleInserted = false;
      for (let attempt = 0; attempt < 3 && !roleInserted; attempt++) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "teacher" as const,
          });

        if (!roleError) {
          roleInserted = true;
        } else if (attempt < 2) {
          console.warn(`Role insert attempt ${attempt + 1} failed, retrying...`, roleError);
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          console.error("Role insert error after retries:", roleError);
          throw new Error("Kunde inte tilldela lärarroll");
        }
      }

      // 6. Mark invitation as used
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !isValid) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[120px] pointer-events-none" />
        <Card className="w-full max-w-md glass-panel border-white/10 relative z-10">
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center mx-auto border border-destructive/20">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Ogiltig inbjudan</h1>
              <p className="text-muted-foreground text-lg">
                Inbjudningslänken är ogiltig eller har gått ut. Kontakta din administratör för en ny länk.
              </p>
            </div>
            <Button onClick={() => navigate("/")} className="w-full h-14 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10">
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />

      {/* Header */}
      <header className="p-8 relative z-10">
        <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
          <img src={noteraLogo} alt="Notera" className="h-10 w-auto" />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <Card className="w-full max-w-lg glass-panel border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <CardHeader className="text-center space-y-6 pt-12">
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-accent">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Lärarinbjudan</span>
              </div>
              <CardTitle className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Välkommen till teamet</CardTitle>
              <div className="space-y-1">
                <CardDescription className="text-lg font-medium">
                  Du har bjudits in som lärare till
                </CardDescription>
                <p className="font-black text-2xl text-accent tracking-tight">
                  {invitation?.organization_name}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-12 pb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation?.email || ""}
                  disabled
                  className="h-14 glass-input rounded-xl text-lg border-white/10 opacity-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Fullständigt namn</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Anna Andersson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`h-14 glass-input rounded-xl text-lg border-white/10 ${errors.fullName ? "border-destructive/50" : ""}`}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive font-bold ml-1">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Välj lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-14 glass-input rounded-xl text-lg border-white/10 ${errors.password ? "border-destructive/50" : ""}`}
                />
                {errors.password && (
                  <p className="text-sm text-destructive font-bold ml-1">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Bekräfta lösenord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-14 glass-input rounded-xl text-lg border-white/10 ${errors.confirmPassword ? "border-destructive/50" : ""}`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive font-bold ml-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      Skapa lärarkonto <ArrowRight className="w-6 h-6" />
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                <LockIcon className="w-4 h-4 text-accent" />
                <span>Ditt konto skyddas med AES-256 kryptering</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeacherInvite;
