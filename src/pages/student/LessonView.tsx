import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, FileText, Mic, Loader2 } from "lucide-react";
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
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
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(lesson.recorded_at)}</p>
          </div>
        </div>
      </header>

      {lesson.audio_url && (
        <div className="bg-card border-b p-4">
          <audio 
            ref={audioRef} 
            src={lesson.audio_url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />
          <Card className="border-0 shadow-md bg-secondary/30">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Slider 
                  value={[currentTime]} 
                  onValueChange={handleSliderChange} 
                  max={duration || 100} 
                  step={1} 
                  className="w-full" 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => handleSkip(-15)}>
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  className="w-16 h-16 rounded-full bg-accent hover:bg-accent/90 btn-glow" 
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => handleSkip(15)}>
                  <SkipForward className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="summary" className="h-full flex flex-col">
          <TabsList className="w-full justify-start px-4 py-3 h-auto bg-transparent border-b rounded-none gap-2">
            <TabsTrigger value="summary" className="gap-2 rounded-xl data-[state=active]:bg-secondary data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4" />
              Sammanfattning
            </TabsTrigger>
            <TabsTrigger value="transcript" className="gap-2 rounded-xl data-[state=active]:bg-secondary data-[state=active]:shadow-sm">
              <Mic className="w-4 h-4" />
              Transkription
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="flex-1 overflow-auto m-0 p-4 animate-fade-in">
            {lesson.summary ? (
              <div className="prose prose-sm max-w-none">{renderMarkdown(lesson.summary)}</div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p>Sammanfattning bearbetas...</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="transcript" className="flex-1 overflow-auto m-0 p-4 animate-fade-in">
            {lesson.transcription ? (
              <div className="text-sm leading-relaxed whitespace-pre-line text-foreground">{lesson.transcription}</div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p>Transkription bearbetas...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LessonView;
