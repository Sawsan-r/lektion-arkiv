import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Play,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  BookOpen,
  ChevronRight,
  Video
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
            onClick={() => navigate("/student")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Tillbaka till översikt</span>
          </button>
          <div className="flex items-center gap-2 text-secondary">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Klassvy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            {className}
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Lärare: <span className="text-white">{teacherName}</span>
          </p>
        </div>

        <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-white/5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tighter">{lessons.length}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lektioner tillgängliga</div>
          </div>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Arkiverade Lektioner</h2>
          <div className="h-[1px] flex-1 bg-white/5 mx-6 hidden md:block" />
        </div>

        {lessons.length === 0 ? (
          <div className="glass-panel p-20 rounded-[3rem] text-center space-y-6 border-dashed border-2 border-white/5">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Video className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Inga lektioner ännu</h3>
              <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                Din lärare har inte publicerat några lektioner för denna klass ännu.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="glass-card p-6 md:p-8 rounded-[2rem] cursor-pointer group relative overflow-hidden hover:bg-white/[0.03] transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/student/lesson/${lesson.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-secondary/20">
                      <Play className="w-8 h-8 text-secondary ml-1" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-2xl text-white tracking-tight group-hover:text-secondary transition-colors">{lesson.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(lesson.recorded_at)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {lesson.summary && (
                      <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                        <FileText className="w-4 h-4" />
                        AI-Sammanfattning
                      </div>
                    )}
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Progress bar placeholder for futuristic look */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-secondary to-transparent w-0 group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassView;
