import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  LogOut, 
  Plus,
  GraduationCap,
  BookOpen,
  ChevronRight,
  Calendar,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ClassWithDetails {
  id: string;
  name: string;
  teacher_name: string;
  lesson_count: number;
  last_lesson_date: string | null;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classCode, setClassCode] = useState("");
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    if (!user) return;

    try {
      // Get all class memberships for this student
      const { data: memberships, error: memberError } = await supabase
        .from("class_members")
        .select(`
          class_id,
          classes (
            id,
            name,
            teacher_id,
            profiles!classes_teacher_id_fkey (full_name)
          )
        `)
        .eq("student_id", user.id);

      if (memberError) throw memberError;

      // Get lesson counts and last lesson dates for each class
      const classesWithDetails = await Promise.all(
        (memberships || []).map(async (membership) => {
          const cls = membership.classes as any;
          if (!cls) return null;

          const { data: lessons, count } = await supabase
            .from("lessons")
            .select("recorded_at", { count: "exact" })
            .eq("class_id", cls.id)
            .eq("status", "ready")
            .order("recorded_at", { ascending: false })
            .limit(1);

          return {
            id: cls.id,
            name: cls.name,
            teacher_name: cls.profiles?.full_name || "Lärare",
            lesson_count: count || 0,
            last_lesson_date: lessons?.[0]?.recorded_at || null,
          };
        })
      );

      setClasses(classesWithDetails.filter(Boolean) as ClassWithDetails[]);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({ title: "Fel", description: "Kunde inte hämta klasser", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!classCode.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      // Find class by join code
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, name, teacher_id, profiles!classes_teacher_id_fkey(full_name)")
        .eq("join_code", classCode.toUpperCase())
        .maybeSingle();

      if (classError) throw classError;

      if (!classData) {
        toast({ title: "Fel", description: "Ogiltig klasskod", variant: "destructive" });
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("class_members")
        .select("id")
        .eq("class_id", classData.id)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({ title: "Info", description: "Du är redan med i denna klass" });
        setClassCode("");
        setIsJoinOpen(false);
        return;
      }

      // Join the class
      const { error: joinError } = await supabase
        .from("class_members")
        .insert({
          class_id: classData.id,
          student_id: user.id,
        });

      if (joinError) throw joinError;

      // Add student role if not already present
      await supabase
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: "student" as const,
        }, { onConflict: "user_id,role" });

      setClasses([
        ...classes,
        {
          id: classData.id,
          name: classData.name,
          teacher_name: (classData.profiles as any)?.full_name || "Lärare",
          lesson_count: 0,
          last_lesson_date: null,
        },
      ]);
      
      setClassCode("");
      setIsJoinOpen(false);
      toast({ title: "Klart!", description: `Du har gått med i ${classData.name}` });
    } catch (error) {
      console.error("Error joining class:", error);
      toast({ title: "Fel", description: "Kunde inte gå med i klassen", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE", { 
      day: "numeric", 
      month: "short" 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Mina lektioner</h1>
              <p className="text-xs text-muted-foreground">Välkommen tillbaka!</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6 pb-24">
        {/* Join Class */}
        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Card className="border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
              <CardContent className="p-4 flex items-center justify-center gap-2 text-primary">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Gå med i en klass</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gå med i klass</DialogTitle>
              <DialogDescription>
                Skanna QR-kod eller ange klasskod
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Ange klasskod"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg"
                  maxLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleJoinClass} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gå med"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Classes */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Dina klasser</h2>
          
          {classes.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Du har inte gått med i någon klass ännu</p>
                <p className="text-sm">Använd en klasskod från din lärare för att gå med</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <Card 
                  key={cls.id} 
                  className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/student/class/${cls.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{cls.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cls.teacher_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{cls.lesson_count}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(cls.last_lesson_date)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
