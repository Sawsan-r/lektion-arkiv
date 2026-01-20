import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, BookOpen, Clock, Search, Calendar, School, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface LessonWithClass {
  id: string;
  title: string;
  subject: string | null;
  summary: string | null;
  status: string;
  recorded_at: string;
  duration_seconds: number | null;
  class_name: string;
  class_id: string;
}

const AllLessons = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonWithClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchAllLessons();
    }
  }, [user]);

  const fetchAllLessons = async () => {
    try {
      // First get all classes the student is enrolled in
      const { data: memberships, error: membershipError } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user!.id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setLessons([]);
        setIsLoading(false);
        return;
      }

      const classIds = memberships.map((m) => m.class_id);

      // Fetch all lessons from those classes
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          subject,
          summary,
          status,
          recorded_at,
          duration_seconds,
          classes!inner(id, name)
        `)
        .in("class_id", classIds)
        .eq("status", "completed")
        .order("recorded_at", { ascending: false });

      if (lessonsError) throw lessonsError;

      const formattedLessons = lessonsData?.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        subject: lesson.subject,
        summary: lesson.summary,
        status: lesson.status,
        recorded_at: lesson.recorded_at,
        duration_seconds: lesson.duration_seconds,
        class_name: (lesson.classes as any)?.name || "Okänd klass",
        class_id: (lesson.classes as any)?.id,
      })) || [];

      setLessons(formattedLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const filteredLessons = lessons.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white">Alla lektioner</h1>
          <p className="text-lg text-muted-foreground">
            Alla inspelade lektioner från dina klasser
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Sök lektioner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 glass-input rounded-xl border-white/10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{lessons.length}</p>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Totalt lektioner</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <School className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">
                {new Set(lessons.map((l) => l.class_id)).size}
              </p>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Klasser</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">
                {Math.round(lessons.reduce((acc, l) => acc + (l.duration_seconds || 0), 0) / 60)}
              </p>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Minuter totalt</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 ? (
        <Card className="glass-panel border-white/10">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black text-white">Inga lektioner ännu</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? "Inga lektioner matchar din sökning."
                : "Dina lärare har inte spelat in några lektioner än. Kom tillbaka snart!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Link key={lesson.id} to={`/student/lesson/${lesson.id}`}>
              <Card className="glass-panel border-white/10 hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20 shrink-0">
                      {lesson.class_name}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tight text-white line-clamp-2">
                      {lesson.title}
                    </h3>
                    {lesson.subject && (
                      <p className="text-sm text-primary font-bold">{lesson.subject}</p>
                    )}
                  </div>
                  {lesson.summary && (
                    <p className="text-muted-foreground line-clamp-2">{lesson.summary}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(lesson.recorded_at), "d MMM yyyy", { locale: sv })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(lesson.duration_seconds)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllLessons;
