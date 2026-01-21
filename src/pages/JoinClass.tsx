import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2, Users, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { z } from "zod";
import noteraLogo from "@/assets/notera-logo-white.png";

const passwordSchema = z.string().min(6, "Lösenord måste vara minst 6 tecken");
const emailSchema = z.string().email("Ogiltig e-postadress");

const JoinClass = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const code = searchParams.get("code");

  const [isLoading, setIsLoading] = useState(!!code);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classData, setClassData] = useState<{
    id: string;
    name: string;
    teacher_name: string;
    organization_name: string;
  } | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; code?: string }>({});
  const [manualCode, setManualCode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (code) {
      fetchClassData(code);
    }
  }, [code]);

  const fetchClassData = async (classCode: string) => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          id, 
          name, 
          profiles!classes_teacher_id_profiles_fkey(full_name),
          organizations(name)
        `)
        .eq("join_code", classCode.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        setClassData(null);
        return false;
      }

      setClassData({
        id: data.id,
        name: data.name,
        teacher_name: (data.profiles as any)?.full_name || "Lärare",
        organization_name: (data.organizations as any)?.name || "Skola",
      });
      return true;
    } catch (err) {
      console.error("Error fetching class:", err);
      setClassData(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim() || manualCode.length < 6) {
      setErrors({ code: "Ange en giltig 6-siffrig klasskod" });
      return;
    }
    setErrors({});
    setIsLookingUp(true);
    const found = await fetchClassData(manualCode.trim());
    setIsLookingUp(false);
    if (!found) {
      setErrors({ code: "Klasskoden kunde inte hittas. Kontrollera att du har rätt kod." });
    } else {
      setSearchParams({ code: manualCode.toUpperCase() });
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Namn krävs";
    }

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !classData) return;

    setIsSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/student`,
          data: {
            full_name: fullName,
          },
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

      if (authData.user) {
        await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "student" as const,
          });

        await supabase
          .from("class_members")
          .insert({
            class_id: classData.id,
            student_id: authData.user.id,
          });

        toast({
          title: "Välkommen!",
          description: `Du har gått med i ${classData.name}`
        });

        navigate("/student");
      }
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

  if (!classData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Header */}
        <header className="absolute top-0 left-0 p-8 z-10">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src={noteraLogo} alt="Notera" className="h-10 w-auto" />
          </Link>
        </header>

        <Card className="w-full max-w-md glass-panel border-white/10 relative z-10">
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter text-white">Gå med i en klass</h1>
              <p className="text-muted-foreground text-lg">
                Ange den 6-siffriga klasskoden du fått av din lärare.
              </p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="KLASSKOD"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className={`text-center font-black text-3xl tracking-[0.3em] h-16 glass-input rounded-xl border-white/10 uppercase ${errors.code ? "border-destructive/50" : ""}`}
                maxLength={6}
              />
              {errors.code && (
                <p className="text-sm text-destructive font-bold">{errors.code}</p>
              )}
              <Button
                onClick={handleManualCodeSubmit}
                disabled={isLookingUp || manualCode.length < 6}
                className="w-full h-14 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary"
              >
                {isLookingUp ? <Loader2 className="w-6 h-6 animate-spin" /> : "Hitta klass"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Har du redan ett konto?{" "}
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-primary font-black hover:underline"
              >
                Logga in här
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />

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
            <div className="w-20 h-20 rounded-[2rem] bg-secondary/10 flex items-center justify-center mx-auto border border-secondary/20">
              <BookOpen className="w-10 h-10 text-secondary" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Inbjudan</span>
              </div>
              <CardTitle className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Gå med i klass</CardTitle>
              <div className="space-y-1">
                <p className="font-black text-2xl text-primary tracking-tight">
                  {classData.name}
                </p>
                <CardDescription className="text-lg font-medium">
                  {classData.teacher_name} · {classData.organization_name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-12 pb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Ditt namn</Label>
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
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-14 glass-input rounded-xl text-lg border-white/10 ${errors.email ? "border-destructive/50" : ""}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive font-bold ml-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Lösenord</Label>
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
                      Gå med i klassen <ArrowRight className="w-6 h-6" />
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>Säker anslutning via Notera AI</span>
              </div>

              <p className="text-center text-base text-muted-foreground">
                Har du redan ett konto?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-primary font-black hover:underline"
                >
                  Logga in här
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default JoinClass;
