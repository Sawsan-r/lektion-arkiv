import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Mic,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  Video
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lesson {
  id: string;
  title: string;
  subject: string | null;
  recorded_at: string;
  duration_seconds: number | null;
  status: string;
  summary: string | null;
}

const ClassLessons = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [classId]);

  const fetchData = async () => {
    try {
      const { data: classData } = await supabase
        .from("classes")
        .select("name")
        .eq("id", classId)
        .single();

      if (classData) {
        setClassName(classData.name);
      }

      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*")
        .eq("class_id", classId)
        .order("recorded_at", { ascending: false });

      setLessons(lessonData || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('lesson-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lessons',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          setLessons(prev =>
            prev.map(lesson =>
              lesson.id === payload.new.id
                ? { ...lesson, ...payload.new as Lesson }
                : lesson
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleDeleteLesson = async () => {
    if (!deleteLesson) return;

    setIsDeleting(true);
    try {
      if (deleteLesson.id) {
        await supabase.storage
          .from("lesson-audio")
          .remove([`${deleteLesson.id}.webm`]);
      }

      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", deleteLesson.id);

      if (error) throw error;

      setLessons(prev => prev.filter(l => l.id !== deleteLesson.id));
      toast({ title: "Lektion raderad" });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({ title: "Fel", description: "Kunde inte radera lektionen", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteLesson(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ready":
        return { icon: CheckCircle2, label: "Klar", color: "text-green-400" };
      case "processing":
        return { icon: Loader2, label: "Bearbetar...", color: "text-primary", spin: true };
      case "recording":
        return { icon: Loader2, label: "Laddar upp...", color: "text-muted-foreground", spin: true };
      case "error":
        return { icon: AlertCircle, label: "Fel - Försök igen", color: "text-destructive" };
      default:
        return { icon: AlertCircle, label: "Okänd status", color: "text-muted-foreground" };
    }
  };

  const retryProcessing = async (lessonId: string) => {
    try {
      toast({ title: "Försöker igen..." });

      await supabase
        .from("lessons")
        .update({ status: "processing" })
        .eq("id", lessonId);

      await supabase.functions.invoke("process-lesson", {
        body: { lessonId },
      });

      toast({ title: "Bearbetning startad" });
    } catch (error) {
      console.error("Error retrying:", error);
      toast({ title: "Fel", description: "Kunde inte starta om bearbetningen", variant: "destructive" });
    }
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Tillbaka till översikt</span>
          </button>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Klasshantering</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            {className}
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Hantera lektioner och AI-insikter för denna klass.
          </p>
        </div>

        <Button
          size="lg"
          className="h-14 px-8 rounded-xl bg-accent text-white font-black text-lg hover:bg-accent/90 transition-all glow-secondary hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
          onClick={() => navigate(`/teacher/record/${classId}`)}
        >
          <Mic className="w-6 h-6" /> Spela in lektion
        </Button>
      </div>

      {/* Lessons Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Lektionsarkiv</h2>
          <div className="h-[1px] flex-1 bg-white/5 mx-6 hidden md:block" />
        </div>

        {lessons.length === 0 ? (
          <div className="glass-panel p-20 rounded-[3rem] text-center space-y-6 border-dashed border-2 border-white/5">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Mic className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Inga lektioner ännu</h3>
              <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                Börja din första inspelning för att se AI-magin hända.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lessons.map((lesson, index) => {
              const statusInfo = getStatusInfo(lesson.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={lesson.id}
                  className="glass-card p-6 md:p-8 rounded-[2rem] group relative overflow-hidden hover:bg-white/[0.03] transition-all"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                        <Video className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-2xl text-white tracking-tight group-hover:text-primary transition-colors">{lesson.title}</h3>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}>
                            <StatusIcon className={`w-3 h-3 ${statusInfo.spin ? 'animate-spin' : ''}`} />
                            {statusInfo.label}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(lesson.recorded_at)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                          {lesson.subject && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50">
                              {lesson.subject}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {lesson.status === "error" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 rounded-xl glass-button border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => retryProcessing(lesson.id)}
                        >
                          Försök igen
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/5">
                            <MoreVertical className="w-6 h-6" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel border-white/10 p-2 min-w-[160px]">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg font-bold uppercase tracking-widest text-[10px] p-3 cursor-pointer"
                            onClick={() => setDeleteLesson(lesson)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Radera Lektion
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteLesson} onOpenChange={(open) => !open && setDeleteLesson(null)}>
        <DialogContent className="glass-panel border-white/10 max-w-md p-8">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Radera lektion?</DialogTitle>
            <DialogDescription className="text-center text-base">
              Är du säker på att du vill radera <span className="text-white font-bold">"{deleteLesson?.title}"</span>?
              Detta raderar permanent ljud, transkription och AI-analys.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-6">
            <Button variant="outline" onClick={() => setDeleteLesson(null)} className="flex-1 h-12 rounded-xl glass-button border-white/10 font-bold">
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLesson}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ja, radera"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassLessons;
