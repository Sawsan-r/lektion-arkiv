import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, FileText, Mic, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface LessonData {
  id: string;
  title: string;
  recorded_at: string;
  duration_seconds: number | null;
  summary: string | null;
  transcription: string | null;
  audio_url: string | null;
}

const LessonView = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (lessonId) fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();
    setLesson(data);
    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return <p key={i} className="ml-4 my-1">• {line.replace('- ', '')}</p>;
      return line ? <p key={i} className="my-1">{line}</p> : null;
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!lesson) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p>Lektion hittades inte</p></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-semibold">{lesson.title}</h1>
            <p className="text-xs text-muted-foreground">{formatDate(lesson.recorded_at)} · {formatDuration(lesson.duration_seconds)}</p>
          </div>
        </div>
      </header>

      {lesson.audio_url && (
        <div className="bg-card border-b p-4">
          <audio ref={audioRef} src={lesson.audio_url} />
          <Card className="border-0 shadow-sm bg-secondary/50">
            <CardContent className="p-4 space-y-4">
              <Slider value={progress} onValueChange={setProgress} max={100} step={1} className="w-full" />
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon"><SkipBack className="w-5 h-5" /></Button>
                <Button size="lg" className="w-14 h-14 rounded-full" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </Button>
                <Button variant="ghost" size="icon"><SkipForward className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon"><Volume2 className="w-5 h-5" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="summary" className="h-full flex flex-col">
          <TabsList className="w-full justify-start px-4 py-2 h-auto bg-transparent border-b rounded-none">
            <TabsTrigger value="summary" className="gap-2 data-[state=active]:bg-secondary"><FileText className="w-4 h-4" />Sammanfattning</TabsTrigger>
            <TabsTrigger value="transcript" className="gap-2 data-[state=active]:bg-secondary"><Mic className="w-4 h-4" />Transkription</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="flex-1 overflow-auto m-0 p-4">
            {lesson.summary ? renderMarkdown(lesson.summary) : <p className="text-muted-foreground">Sammanfattning bearbetas...</p>}
          </TabsContent>
          <TabsContent value="transcript" className="flex-1 overflow-auto m-0 p-4">
            {lesson.transcription ? <div className="text-sm leading-relaxed whitespace-pre-line">{lesson.transcription}</div> : <p className="text-muted-foreground">Transkription bearbetas...</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LessonView;
