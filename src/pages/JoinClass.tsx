import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Loader2, XCircle, Users } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string().min(6, "Lösenord måste vara minst 6 tecken");
const emailSchema = z.string().email("Ogiltig e-postadress");

const JoinClass = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const code = searchParams.get("code");
  
  const [isLoading, setIsLoading] = useState(true);
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
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  useEffect(() => {
    if (code) {
      fetchClassData();
    } else {
      setIsLoading(false);
    }
  }, [code]);

  const fetchClassData = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          id, 
          name, 
          profiles!classes_teacher_id_fkey(full_name),
          organizations(name)
        `)
        .eq("join_code", code?.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        setClassData(null);
        setIsLoading(false);
        return;
      }

      setClassData({
        id: data.id,
        name: data.name,
        teacher_name: (data.profiles as any)?.full_name || "Lärare",
        organization_name: (data.organizations as any)?.name || "Skola",
      });
    } catch (err) {
      console.error("Error fetching class:", err);
      setClassData(null);
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
      // Create user account
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
          navigate("/auth");
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // Add student role
        await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "student" as const,
          });

        // Join the class
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!code || !classData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">Ogiltig klasskod</h1>
            <p className="text-muted-foreground">
              Klasskoden kunde inte hittas. Kontrollera att du har rätt kod.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg">LektionsLyft</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-slide-up">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl">Gå med i klass</CardTitle>
              <p className="font-semibold text-foreground text-lg">
                {classData.name}
              </p>
              <CardDescription>
                {classData.teacher_name} · {classData.organization_name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ditt namn</Label>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Gå med i klassen
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Har du redan ett konto?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-primary hover:underline"
                >
                  Logga in
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
