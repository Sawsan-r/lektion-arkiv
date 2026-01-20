import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Mic,
  ChevronRight,
  QrCode as QrCodeIcon,
  BookOpen,
  Loader2,
  Copy,
  Check,
  Users,
  Video,
  Sparkles,
  School
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

interface ClassData {
  id: string;
  name: string;
  join_code: string;
  student_count: number;
  lesson_count: number;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, organizations(name)")
      .eq("id", user.id)
      .single();

    if (profile?.organizations) {
      setOrganizationName((profile.organizations as { name: string }).name);
    }
  };

  const fetchClasses = async () => {
    if (!user) return;

    try {
      const { data: classData, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const classesWithCounts = await Promise.all(
        (classData || []).map(async (cls) => {
          const [studentResult, lessonResult] = await Promise.all([
            supabase
              .from("class_members")
              .select("id", { count: "exact", head: true })
              .eq("class_id", cls.id),
            supabase
              .from("lessons")
              .select("id", { count: "exact", head: true })
              .eq("class_id", cls.id),
          ]);

          return {
            ...cls,
            student_count: studentResult.count || 0,
            lesson_count: lessonResult.count || 0,
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error("Error fetching classes:", error);
      if ((error as any)?.code !== 'PGRST116') {
        toast({ title: "Fel", description: "Kunde inte hämta klasser", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) {
        toast({ title: "Fel", description: "Du tillhör ingen organisation", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase
        .from("classes")
        .insert({
          name: newClassName,
          teacher_id: user.id,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;

      setClasses([
        { ...data, student_count: 0, lesson_count: 0 },
        ...classes,
      ]);
      setNewClassName("");
      setIsCreateOpen(false);
      toast({ title: "Klass skapad", description: newClassName });
    } catch (error) {
      console.error("Error creating class:", error);
      toast({ title: "Fel", description: "Kunde inte skapa klassen", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalStudents = classes.reduce((a, c) => a + c.student_count, 0);
  const totalLessons = classes.reduce((a, c) => a + c.lesson_count, 0);

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
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Lärarpanel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Välkommen, <span className="neon-text">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Hantera dina klasser och AI-drivna lektioner på {organizationName || "din skola"}.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-8 rounded-xl bg-primary text-white font-black text-lg hover:bg-primary/90 transition-all glow-primary hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3">
              <Plus className="w-6 h-6" /> Skapa ny klass
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 max-w-md p-8">
            <DialogHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <School className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-center">Ny klass</DialogTitle>
              <DialogDescription className="text-center text-lg">
                Ge din klass ett namn för att komma igång.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Klassnamn</Label>
              <Input
                placeholder="T.ex. Matematik 9A"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="h-14 glass-input rounded-xl text-lg border-white/10"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateClass} className="w-full h-14 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Skapa klass nu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Aktiva Klasser", value: classes.length, icon: BookOpen, color: "text-primary" },
          { label: "Totala Elever", value: totalStudents, icon: Users, color: "text-secondary" },
          { label: "AI Lektioner", value: totalLessons, icon: Video, color: "text-accent" },
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
              <School className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Inga klasser skapade</h3>
              <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                Skapa din första klass för att börja spela in lektioner med AI.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map((cls, index) => (
              <div
                key={cls.id}
                className="glass-card p-8 rounded-[2rem] group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <School className="w-32 h-32 text-white" />
                </div>

                <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5 cursor-pointer" onClick={() => navigate(`/teacher/class/${cls.id}`)}>
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                        <BookOpen className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl text-white tracking-tight group-hover:text-primary transition-colors">{cls.name}</h3>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                          Kod: <span className="text-secondary font-black">{cls.join_code}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={isQROpen && selectedClass?.id === cls.id} onOpenChange={(open) => {
                        setIsQROpen(open);
                        if (open) setSelectedClass(cls);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl glass-button border-white/10 hover:bg-white/10">
                            <QrCodeIcon className="w-5 h-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-panel border-white/10 max-w-sm p-8">
                          <DialogHeader className="space-y-4">
                            <DialogTitle className="text-2xl font-black tracking-tight text-center">QR-kod för {cls.name}</DialogTitle>
                            <DialogDescription className="text-center text-base">
                              Elever kan skanna denna kod för att gå med direkt.
                            </DialogDescription>
                          </DialogHeader>
                          <QRCodeDisplay joinCode={cls.join_code} />
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="icon"
                        className="h-12 w-12 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25 hover:scale-105 transition-all"
                        onClick={() => navigate(`/teacher/record/${cls.id}`)}
                      >
                        <Mic className="w-5 h-5 text-white" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Elever</span>
                      </div>
                      <div className="text-xl font-black text-white">{cls.student_count}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Lektioner</span>
                      </div>
                      <div className="text-xl font-black text-white">{cls.lesson_count}</div>
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

const QRCodeDisplay = ({ joinCode }: { joinCode: string }) => {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join?code=${joinCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-6 flex flex-col items-center gap-6">
      <div className="p-6 bg-white rounded-[2rem] shadow-2xl">
        <QRCodeSVG
          value={joinUrl}
          size={200}
          level="H"
          includeMargin={false}
        />
      </div>
      <div className="text-center space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Klasskod</p>
        <p className="font-black text-4xl tracking-[0.2em] text-primary">{joinCode}</p>
      </div>
      <Button
        variant="outline"
        size="lg"
        onClick={handleCopy}
        className="w-full h-14 rounded-xl glass-button border-white/10 hover:bg-white/10 gap-3 font-bold"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 text-green-400" />
            Kopierad!
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            Kopiera länk
          </>
        )}
      </Button>
    </div>
  );
};

export default TeacherDashboard;
