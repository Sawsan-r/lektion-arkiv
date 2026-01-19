import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, ArrowLeft, Loader2, Sparkles, ShieldCheck, Mail, Lock, User } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Ogiltig e-postadress");
const passwordSchema = z.string().min(6, "Lösenord måste vara minst 6 tecken");

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading, signIn, signUp, roles } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [isProcessingJoin, setIsProcessingJoin] = useState(false);

  const inviteToken = searchParams.get("invite");
  const joinCode = searchParams.get("joinCode");

  useEffect(() => {
    if (user && !authLoading && joinCode && !isProcessingJoin) {
      handleJoinClassAfterLogin();
    } else if (user && !authLoading && roles.length > 0 && !joinCode) {
      redirectBasedOnRole();
    }
  }, [user, authLoading, roles, joinCode]);

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
    try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
    try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
    if (!isLogin && !fullName.trim()) newErrors.fullName = "Namn krävs";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
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
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: "Konto kunde inte skapas",
            description: error.message.includes("already registered") ? "E-postadressen är redan registrerad" : error.message,
            variant: "destructive"
          });
        } else {
          toast({ title: "Konto skapat!", description: "Kontrollera din e-post för att verifiera kontot." });
        }
      }
    } catch (err) {
      toast({ title: "Ett fel uppstod", description: "Vänligen försök igen senare", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

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
              <Sparkles className="w-8 h-8 text-secondary animate-pulse" />
            </div>
            <CardTitle className="text-4xl font-black tracking-tight text-white">
              {isLogin ? "Välkommen tillbaka" : "Skapa ditt konto"}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {isLogin
                ? "Logga in för att fortsätta din AI-resa"
                : inviteToken
                  ? "Du har blivit inbjuden som lärare till Notera"
                  : "Börja använda framtidens klassrumshantering"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Fullständigt namn</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="fullName"
                      placeholder="Anna Andersson"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`h-14 pl-12 glass-input rounded-xl text-lg ${errors.fullName ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive font-medium ml-1">{errors.fullName}</p>}
                </div>
              )}

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

              <Button
                type="submit"
                className="w-full h-14 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary hover:scale-[1.02] active:scale-[0.98] mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isLogin ? (
                  "Logga in"
                ) : (
                  "Skapa konto"
                )}
              </Button>
            </form>

            <div className="mt-10 text-center relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
              <span className="relative bg-transparent px-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Eller</span>
            </div>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                className="text-lg font-bold text-muted-foreground hover:text-secondary transition-colors"
              >
                {isLogin ? "Har du inget konto? Skapa ett här" : "Har du redan ett konto? Logga in här"}
              </button>
            </div>
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
