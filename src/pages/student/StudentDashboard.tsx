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
  Plus,
  BookOpen,
  ChevronRight,
  Calendar,
  Loader2,
  Sparkles,
  GraduationCap,
  Trophy,
  Clock,
  School,
  Video
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
  const { user } = useAuth();
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
      const { data: memberships, error: memberError } = await supabase
        .from("class_members")
        .select(`
          class_id,
          classes (
            id,
            name,
            teacher_id,
            profiles!classes_teacher_id_profiles_fkey (full_name)
          )
        `)
        .eq("student_id", user.id);

      if (memberError) throw memberError;

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
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, name, teacher_id, profiles!classes_teacher_id_profiles_fkey(full_name)")
        .eq("join_code", classCode.toUpperCase())
        .maybeSingle();

      if (classError) throw classError;

      if (!classData) {
        toast({ title: "Fel", description: "Ogiltig klasskod", variant: "destructive" });
        return;
      }

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

      const { error: joinError } = await supabase
        .from("class_members")
        .insert({
          class_id: classData.id,
          student_id: user.id,
        });

      if (joinError) throw joinError;

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Inga lektioner";
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Elevpanel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Välkommen, <span className="neon-text">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Här är dina aktuella klasser och lektioner.
          </p>
        </div>

        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-8 rounded-xl bg-primary text-white font-black text-lg hover:bg-primary/90 transition-all glow-primary hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3">
              <Plus className="w-6 h-6" /> Gå med i klass
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 max-w-md p-8">
            <DialogHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-center">Gå med i klass</DialogTitle>
              <DialogDescription className="text-center text-lg">
                Ange den 6-siffriga koden du fått av din lärare.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8">
              <Input
                placeholder="KOD"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="text-center font-black text-4xl tracking-[0.5em] h-20 glass-input rounded-2xl border-white/10 uppercase"
                maxLength={6}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleJoinClass} className="w-full h-14 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Gå med nu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Mina Klasser", value: classes.length, icon: GraduationCap, color: "text-primary" },
          { label: "Totala Lektioner", value: classes.reduce((acc, curr) => acc + curr.lesson_count, 0), icon: BookOpen, color: "text-secondary" },
          { label: "Prestationer", value: "3", icon: Trophy, color: "text-accent" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-8 rounded-3xl flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} border border-white/5`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Classes Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Dina Klasser</h2>
          <div className="h-[1px] flex-1 bg-white/5 mx-6 hidden md:block" />
        </div>

        {classes.length === 0 ? (
          <div className="glass-panel p-20 rounded-[3rem] text-center space-y-6 border-dashed border-2 border-white/5">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <BookOpen className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Inga klasser ännu</h3>
              <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                Använd en klasskod från din lärare för att börja din resa med Notera.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map((cls, index) => (
              <div
                key={cls.id}
                className="glass-card p-8 rounded-[2rem] cursor-pointer group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/student/class/${cls.id}`)}
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <BookOpen className="w-32 h-32 text-white" />
                </div>

                <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                        <School className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl text-white tracking-tight group-hover:text-primary transition-colors">{cls.name}</h3>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                          Lärare: {cls.teacher_name}
                        </p>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Lektioner</span>
                      </div>
                      <div className="text-xl font-black text-white">{cls.lesson_count}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Senaste</span>
                      </div>
                      <div className="text-xl font-black text-white">{formatDate(cls.last_lesson_date)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
