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
  AlertCircle
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
      // Fetch class info
      const { data: classData } = await supabase
        .from("classes")
        .select("name")
        .eq("id", classId)
        .single();

      if (classData) {
        setClassName(classData.name);
      }

      // Fetch lessons
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
      // Delete audio file first
      if (deleteLesson.id) {
        await supabase.storage
          .from("lesson-audio")
          .remove([`${deleteLesson.id}.webm`]);
      }

      // Delete lesson record
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
    return date.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ready":
        return { icon: CheckCircle2, label: "Klar", color: "text-success" };
      case "processing":
        return { icon: Loader2, label: "Bearbetar...", color: "text-primary", spin: true };
      case "recording":
        return { icon: Loader2, label: "Laddar upp...", color: "text-muted-foreground", spin: true };
      case "error":
        return { icon: AlertCircle, label: "Fel - Tryck för att försöka igen", color: "text-destructive" };
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">{className}</h1>
              <p className="text-xs text-muted-foreground">{lessons.length} lektioner</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="gap-1.5 bg-accent hover:bg-accent/90"
            onClick={() => navigate(`/teacher/record/${classId}`)}
          >
            <Mic className="w-4 h-4" />
            Spela in
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {lessons.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-primary/60" />
              </div>
              <p className="font-medium text-foreground">Inga lektioner ännu</p>
              <p className="text-sm mt-1">Tryck på "Spela in" för att börja</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => {
              const statusInfo = getStatusInfo(lesson.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={lesson.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{lesson.title}</h3>
                          <StatusIcon 
                            className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`} 
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lesson.recorded_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                        </div>
                        {lesson.subject && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-secondary text-xs">
                            {lesson.subject}
                          </span>
                        )}
                        {lesson.summary && lesson.status === "ready" && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-success">
                            <FileText className="w-3 h-3" />
                            <span>Sammanfattning klar</span>
                          </div>
                        )}
                        {lesson.status === "error" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              retryProcessing(lesson.id);
                            }}
                          >
                            Försök igen
                          </Button>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteLesson(lesson)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Radera
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteLesson} onOpenChange={(open) => !open && setDeleteLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Radera lektion?</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill radera "{deleteLesson?.title}"? 
              Detta kan inte ångras och all data inklusive ljud, transkription och sammanfattning raderas permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteLesson(null)}>
              Avbryt
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteLesson}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Radera"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassLessons;
