import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FileText,
  Mic,
  Loader2,
  Speech,
  Sparkles,
  Clock,
  Calendar,
  ChevronLeft
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (lessonId) fetchLesson();

    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [lessonId]);

  const fetchLesson = async () => {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (data && data.audio_url) {
      const { data: signedUrlData } = await supabase.storage
        .from("lesson-audio")
        .createSignedUrl(data.audio_url, 3600);

      if (signedUrlData) {
        data.audio_url = signedUrlData.signedUrl;
      }
    }

    setLesson(data);
    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
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

  const toggleSpeakSummary = () => {
    if (!lesson?.summary) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      toast({
        title: "Ej stöd",
        description: "Din webbläsare stöder inte text-till-tal",
        variant: "destructive"
      });
      return;
    }

    const cleanText = lesson.summary
      .replace(/^##\s+/gm, '')
      .replace(/^###\s+/gm, '')
      .replace(/^-\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'sv-SE';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const swedishVoice = voices.find(v => v.lang.startsWith('sv'));
    if (swedishVoice) {
      utterance.voice = swedishVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black mt-8 mb-4 text-white tracking-tight">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-6 mb-2 text-primary tracking-tight">{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return (
        <div key={i} className="flex gap-3 my-2 items-start">
          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
          <p className="text-muted-foreground leading-relaxed">{line.replace('- ', '')}</p>
        </div>
      );
      return line ? <p key={i} className="my-3 text-muted-foreground leading-relaxed">{line}</p> : null;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <p className="text-xl font-black text-white">Lektionen hittades inte</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl">Gå tillbaka</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Tillbaka till klassen</span>
          </button>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Lektionsvy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            {lesson.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold uppercase tracking-widest text-xs">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(lesson.recorded_at)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {lesson.duration_seconds ? formatTime(lesson.duration_seconds) : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Player Section */}
      {lesson.audio_url && (
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <Volume2 className="w-40 h-40 text-white" />
          </div>

          <audio
            ref={audioRef}
            src={lesson.audio_url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />

          <div className="space-y-8 relative z-10">
            <div className="space-y-3">
              <Slider
                value={[currentTime]}
                onValueChange={handleSliderChange}
                max={duration || 100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs font-black text-muted-foreground uppercase tracking-widest">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/5" onClick={() => handleSkip(-15)}>
                <SkipBack className="w-6 h-6" />
              </Button>

              <Button
                size="lg"
                className="w-20 h-20 rounded-full bg-primary text-white hover:bg-primary/90 glow-primary transition-all hover:scale-105 active:scale-95"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
              </Button>

              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/5" onClick={() => handleSkip(15)}>
                <SkipForward className="w-6 h-6" />
              </Button>

              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/5" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-6 h-6 text-destructive" /> : <Volume2 className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="summary" className="space-y-8">
          <TabsList className="w-full md:w-auto p-1 bg-white/5 rounded-2xl border border-white/10">
            <TabsTrigger value="summary" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-xs transition-all">
              <FileText className="w-4 h-4 mr-2" />
              Sammanfattning
            </TabsTrigger>
            <TabsTrigger value="transcript" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-xs transition-all">
              <Mic className="w-4 h-4 mr-2" />
              Transkription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="glass-card p-10 md:p-16 rounded-[3rem] border-white/5">
              {lesson.summary ? (
                <div className="space-y-8">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={toggleSpeakSummary}
                      className={`h-12 rounded-xl glass-button border-white/10 gap-3 font-bold ${isSpeaking ? 'bg-primary/20 text-primary border-primary/30' : ''}`}
                    >
                      <Speech className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      {isSpeaking ? "Stoppa uppläsning" : "Lyssna på sammanfattning"}
                    </Button>
                  </div>
                  <div className="max-w-3xl mx-auto">{renderMarkdown(lesson.summary)}</div>
                </div>
              ) : (
                <div className="text-center py-20 space-y-6">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary opacity-50" />
                  <p className="text-xl font-bold text-muted-foreground">AI bearbetar sammanfattningen...</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="glass-card p-10 md:p-16 rounded-[3rem] border-white/5">
              {lesson.transcription ? (
                <div className="max-w-3xl mx-auto text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                  {lesson.transcription}
                </div>
              ) : (
                <div className="text-center py-20 space-y-6">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary opacity-50" />
                  <p className="text-xl font-bold text-muted-foreground">AI bearbetar transkriptionen...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LessonView;
