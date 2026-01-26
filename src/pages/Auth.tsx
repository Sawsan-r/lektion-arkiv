import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, ArrowLeft, Loader2, Sparkles, ShieldCheck, Mail, Lock, Users, KeyRound } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Ogiltig e-postadress");
const passwordSchema = z.string().min(6, "Lösenord måste vara minst 6 tecken");

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading, signIn, roles } = useAuth();

  const initialMode = searchParams.get("mode") === "update-password" ? "update-password" : "login";
  const [mode, setMode] = useState<"login" | "reset" | "update-password">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [resetSent, setResetSent] = useState(false);
  const [isProcessingJoin, setIsProcessingJoin] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const joinCode = searchParams.get("joinCode");

  // Handle password recovery token from URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    
    if (type === "recovery" && accessToken) {
      setMode("update-password");
      // DON'T clear the hash - let Supabase's onAuthStateChange process it
      // Supabase will automatically establish a session from the recovery token
    }
  }, []);

  useEffect(() => {
    if (mode === "update-password") return; // Don't redirect if updating password
    
    if (user && !authLoading && joinCode && !isProcessingJoin) {
      handleJoinClassAfterLogin();
    } else if (user && !authLoading && roles.length > 0 && !joinCode) {
      redirectBasedOnRole();
    }
  }, [user, authLoading, roles, joinCode, mode]);

  const handleJoinClassAfterLogin = async () => {
    setIsProcessingJoin(true);
    try {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user!.id,
        role: "student" as const,
      });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error("Error assigning role:", roleError);
      }

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("join_code", joinCode!.toUpperCase())
        .maybeSingle();

      if (classError || !classData) {
        toast({
          title: "Fel",
          description: classError ? "Kunde inte hitta klassen" : "Ogiltig klasskod",
          variant: "destructive"
        });
        navigate("/student", { replace: true });
        return;
      }

      const { error: joinError } = await supabase.from("class_members").insert({
        class_id: classData.id,
        student_id: user!.id,
      });

      if (joinError && !joinError.message.includes('duplicate')) {
        toast({ title: "Fel", description: "Kunde inte gå med i klassen", variant: "destructive" });
      } else {
        toast({ title: "Välkommen!", description: "Du har nu gått med i klassen." });
      }

      navigate("/student", { replace: true });
    } catch (error) {
      navigate("/student", { replace: true });
    }
  };

  const redirectBasedOnRole = () => {
    if (roles.includes('system_admin')) navigate("/admin", { replace: true });
    else if (roles.includes('teacher')) navigate("/teacher", { replace: true });
    else if (roles.includes('student')) navigate("/student", { replace: true });
    else navigate("/", { replace: true });
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (mode === "update-password") {
      try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Lösenorden matchar inte";
      }
    } else {
      try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
      if (mode !== "reset") {
        try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordReset = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=update-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "E-post skickad!", description: "Kontrollera din inkorg för att återställa lösenordet." });
    } catch (err: any) {
      toast({ title: "Fel", description: err.message || "Kunde inte skicka återställningslänk", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!validateForm()) return;
    
    // Verify we have an active session (established from recovery token)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ 
        title: "Sessionsfel", 
        description: "Ingen aktiv session. Begär en ny återställningslänk.",
        variant: "destructive" 
      });
      setMode("reset");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordUpdated(true);
      toast({ title: "Lösenord uppdaterat!", description: "Du kan nu logga in med ditt nya lösenord." });
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => {
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        navigate("/auth", { replace: true });
      }, 2000);
    } catch (err: any) {
      toast({ title: "Fel", description: err.message || "Kunde inte uppdatera lösenordet", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "update-password") {
      await handlePasswordUpdate();
      return;
    }
    
    if (mode === "reset") {
      await handlePasswordReset();
      return;
    }
    
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Inloggning misslyckades",
          description: error.message.includes("Invalid login") ? "Felaktig e-post eller lösenord" : error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Välkommen tillbaka!" });
      }
    } catch (err) {
      toast({ title: "Ett fel uppstod", description: "Vänligen försök igen senare", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading && mode !== "update-password") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const getTitle = () => {
    if (mode === "update-password") return "Nytt lösenord";
    if (mode === "reset") return "Återställ lösenord";
    return "Välkommen tillbaka";
  };

  const getDescription = () => {
    if (mode === "update-password") {
      return passwordUpdated ? "Ditt lösenord har uppdaterats!" : "Ange ditt nya lösenord";
    }
    if (mode === "reset") {
      return resetSent ? "Kolla din e-post för återställningslänken" : "Ange din e-postadress för att återställa ditt lösenord";
    }
    return "Logga in för att fortsätta din AI-resa";
  };

  const getIcon = () => {
    if (mode === "update-password") return <KeyRound className="w-8 h-8 text-secondary animate-pulse" />;
    return <Sparkles className="w-8 h-8 text-secondary animate-pulse" />;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between relative z-10">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white transition-colors" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" /> Tillbaka
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-white">Notera</span>
        </div>
        <div className="w-20" /> {/* Spacer */}
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <Card className="w-full max-w-lg glass-panel border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

          <CardHeader className="text-center space-y-4 pt-10">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2 border border-white/10">
              {getIcon()}
            </div>
            <CardTitle className="text-4xl font-black tracking-tight text-white">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {getDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "update-password" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Nytt lösenord</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`h-14 pl-12 glass-input rounded-xl text-lg ${errors.password ? "border-destructive" : ""}`}
                        disabled={passwordUpdated}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive font-medium ml-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Bekräfta lösenord</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`h-14 pl-12 glass-input rounded-xl text-lg ${errors.confirmPassword ? "border-destructive" : ""}`}
                        disabled={passwordUpdated}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive font-medium ml-1">{errors.confirmPassword}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">E-postadress</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="din@email.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`h-14 pl-12 glass-input rounded-xl text-lg ${errors.email ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive font-medium ml-1">{errors.email}</p>}
                  </div>

                  {mode !== "reset" && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Lösenord</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`h-14 pl-12 glass-input rounded-xl text-lg ${errors.password ? "border-destructive" : ""}`}
                        />
                      </div>
                      {errors.password && <p className="text-sm text-destructive font-medium ml-1">{errors.password}</p>}
                    </div>
                  )}

                  {mode === "login" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => { setMode("reset"); setErrors({}); setResetSent(false); }}
                        className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                      >
                        Glömt lösenord?
                      </button>
                    </div>
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full h-14 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary hover:scale-[1.02] active:scale-[0.98] mt-4"
                disabled={isLoading || (mode === "reset" && resetSent) || passwordUpdated}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : mode === "update-password" ? (
                  passwordUpdated ? "Lösenord uppdaterat!" : "Uppdatera lösenord"
                ) : mode === "reset" ? (
                  resetSent ? "E-post skickad!" : "Skicka återställningslänk"
                ) : (
                  "Logga in"
                )}
              </Button>
            </form>

            {mode !== "update-password" && (
              <>
                <div className="mt-10 text-center relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                  <span className="relative bg-transparent px-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Eller</span>
                </div>

                <div className="mt-8 space-y-4">
                  {mode === "reset" ? (
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setErrors({}); setResetSent(false); }}
                      className="w-full text-lg font-bold text-muted-foreground hover:text-secondary transition-colors text-center"
                    >
                      Tillbaka till inloggning
                    </button>
                  ) : (
                    <Link to="/join" className="block">
                      <Button 
                        variant="outline" 
                        className="w-full h-14 rounded-xl glass-button border-white/10 font-bold text-lg hover:bg-white/10 gap-3"
                      >
                        <Users className="w-5 h-5" />
                        Elev? Gå med i en klass
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            )}

            {mode === "update-password" && passwordUpdated && (
              <div className="mt-8 text-center">
                <p className="text-muted-foreground">Omdirigerar till inloggning...</p>
              </div>
            )}
          </CardContent>

          <div className="bg-white/5 p-6 border-t border-white/5 flex items-center justify-center gap-4">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Säker och krypterad anslutning</span>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Auth;