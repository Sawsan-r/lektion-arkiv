import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Play,
  Calendar,
  Clock,
  FileText,
  Loader2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Lesson {
  id: string;
  title: string;
  recorded_at: string;
  duration_seconds: number | null;
  summary: string | null;
  status: string;
}

const ClassView = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [className, setClassName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const { data: classData } = await supabase
        .from("classes")
        .select("name, profiles!classes_teacher_id_profiles_fkey(full_name)")
        .eq("id", classId)
        .single();

      if (classData) {
        setClassName(classData.name);
        setTeacherName((classData.profiles as any)?.full_name || "Lärare");
      }

      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*")
        .eq("class_id", classId)
        .eq("status", "ready")
        .order("recorded_at", { ascending: false });

      setLessons(lessonData || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{className}</h1>
            <p className="text-xs text-muted-foreground">{teacherName}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        <h2 className="font-semibold text-lg">Lektioner</h2>
        
        {lessons.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Inga lektioner ännu</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <Card 
                key={lesson.id} 
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/student/lesson/${lesson.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{lesson.title}</h3>
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
                      {lesson.summary && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                          <FileText className="w-3 h-3" />
                          <span>Sammanfattning tillgänglig</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassView;
