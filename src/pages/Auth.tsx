import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, ArrowLeft, Loader2 } from "lucide-react";
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

  // Handle class join after login
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
      // Step 1: Assign student role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user!.id,
        role: "student" as const,
      });
      
      // Ignore duplicate key error (user already has student role)
      if (roleError && !roleError.message.includes('duplicate')) {
        console.error("Error assigning role:", roleError);
      }

      // Step 2: Find the class
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("join_code", joinCode!.toUpperCase())
        .maybeSingle();

      if (classError) {
        console.error("Error finding class:", classError);
        toast({ 
          title: "Fel", 
          description: "Kunde inte hitta klassen", 
          variant: "destructive" 
        });
        navigate("/student", { replace: true });
        return;
      }

      if (!classData) {
        toast({ 
          title: "Fel", 
          description: "Ogiltig klasskod", 
          variant: "destructive" 
        });
        navigate("/student", { replace: true });
        return;
      }

      // Step 3: Join the class
      const { error: joinError } = await supabase.from("class_members").insert({
        class_id: classData.id,
        student_id: user!.id,
      });

      // Ignore duplicate key error (already a member)
      if (joinError && !joinError.message.includes('duplicate')) {
        console.error("Error joining class:", joinError);
        toast({ 
          title: "Fel", 
          description: "Kunde inte gå med i klassen", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Du har gått med i klassen!" });
      }

      navigate("/student", { replace: true });
    } catch (error) {
      console.error("Error in join flow:", error);
      navigate("/student", { replace: true });
    }
  };

  const redirectBasedOnRole = () => {
    if (roles.includes('system_admin')) {
      navigate("/admin", { replace: true });
    } else if (roles.includes('teacher')) {
      navigate("/teacher", { replace: true });
    } else if (roles.includes('student')) {
      navigate("/student", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
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

    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = "Namn krävs";
    }

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
          if (error.message.includes("Invalid login")) {
            toast({ title: "Fel", description: "Felaktig e-post eller lösenord", variant: "destructive" });
          } else {
            toast({ title: "Fel", description: error.message, variant: "destructive" });
          }
        } else {
          toast({ title: "Välkommen tillbaka!" });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "Fel", description: "E-postadressen är redan registrerad", variant: "destructive" });
          } else {
            toast({ title: "Fel", description: error.message, variant: "destructive" });
          }
        } else {
          toast({ 
            title: "Konto skapat!", 
            description: "Kontrollera din e-post för att verifiera kontot." 
          });
        }
      }
    } catch (err) {
      toast({ title: "Fel", description: "Något gick fel", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">Notera</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-slide-up">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">
              {isLogin ? "Logga in" : "Skapa konto"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Välkommen tillbaka till Notera" 
                : inviteToken 
                  ? "Du har blivit inbjuden som lärare"
                  : "Skapa ett nytt konto"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Fullständigt namn</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Anna Andersson"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full touch-target"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isLogin ? (
                  "Logga in"
                ) : (
                  "Skapa konto"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Har du inget konto? Skapa ett" : "Har du redan ett konto? Logga in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
