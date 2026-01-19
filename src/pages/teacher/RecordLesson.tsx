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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Mic,
  Square,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  Info,
  Lock as LockIcon
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRecorder } from "@/hooks/useRecorder";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const RecordLesson = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const recorder = useRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [className, setClassName] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSubject, setLessonSubject] = useState("");
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchClassName();
    }
  }, [classId]);

  const fetchClassName = async () => {
    const { data } = await supabase
      .from("classes")
      .select("name")
      .eq("id", classId)
      .single();

    if (data) {
      setClassName(data.name);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    await recorder.startRecording();
    if (!recorder.error) {
      toast({ title: "Inspelning startad" });
    } else {
      toast({
        title: "Kunde inte starta inspelning",
        description: recorder.error,
        variant: "destructive"
      });
    }
  };

  const handlePauseResume = () => {
    if (recorder.isPaused) {
      recorder.resumeRecording();
    } else {
      recorder.pauseRecording();
    }
  };

  const handleStopRecording = () => {
    setShowTitleDialog(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim() || !classId || !user) {
      toast({ title: "Fel", description: "Ange en titel för lektionen", variant: "destructive" });
      return;
    }

    setShowTitleDialog(false);
    setIsProcessing(true);

    try {
      const audioBlob = await recorder.stopRecording();

      const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .insert({
          class_id: classId,
          title: lessonTitle,
          subject: lessonSubject || null,
          duration_seconds: recorder.seconds,
          status: "recording",
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      setCreatedLessonId(lesson.id);

      if (audioBlob && audioBlob.size > 0) {
        const fileName = `${lesson.id}.webm`;

        const { error: uploadError } = await supabase.storage
          .from("lesson-audio")
          .upload(fileName, audioBlob, {
            contentType: "audio/webm",
            upsert: true,
          });

        if (uploadError) {
          await supabase.from("lessons").delete().eq("id", lesson.id);
          throw uploadError;
        }

        await supabase
          .from("lessons")
          .update({ audio_url: fileName })
          .eq("id", lesson.id);
      }

      try {
        await supabase.functions.invoke("process-lesson", {
          body: { lessonId: lesson.id },
        });
      } catch (aiError) {
        console.error("AI processing trigger failed:", aiError);
        await supabase
          .from("lessons")
          .update({ status: "ready" })
          .eq("id", lesson.id);
      }

      setIsProcessing(false);
      setIsComplete(true);
      toast({
        title: "Lektion sparad!",
        description: "AI-sammanfattning skapas i bakgrunden"
      });
    } catch (error) {
      console.error("Error saving lesson:", error);
      setIsProcessing(false);
      toast({
        title: "Fel",
        description: "Kunde inte spara lektionen",
        variant: "destructive"
      });
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[128px] pointer-events-none" />
        <Card className="w-full max-w-lg glass-panel border-white/10 shadow-2xl animate-in zoom-in duration-500">
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-24 h-24 rounded-[2.5rem] bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Lektion sparad!</h1>
              <p className="text-xl font-bold text-primary">
                {lessonTitle} • {formatTime(recorder.seconds)}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                AI-sammanfattning och transkribering bearbetas nu.
                Dina elever kommer att se den i sitt arkiv inom kort.
              </p>
            </div>
            <Button
              className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary"
              onClick={() => navigate("/teacher")}
            >
              Tillbaka till översikt
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[128px] pointer-events-none" />
        <Card className="w-full max-w-lg glass-panel border-white/10 shadow-2xl">
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Bearbetar...</h1>
              <p className="text-muted-foreground text-lg">
                Laddar upp inspelning och förbereder AI-analys. Vänligen vänta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      <header className="p-8 flex items-center gap-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="h-12 w-12 rounded-xl hover:bg-white/5 group">
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </Button>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Inspelning</span>
          <span className="text-xl font-black text-white tracking-tight">{className || "Ny Lektion"}</span>
        </div>
      </header>

      {/* Main Recording Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl space-y-16 text-center">
          {recorder.error && (
            <div className="glass-panel border-destructive/30 bg-destructive/5 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
              <p className="text-sm font-bold text-destructive">{recorder.error}</p>
            </div>
          )}

          {/* Futuristic Timer */}
          <div className="relative inline-block">
            <div className={`absolute -inset-8 bg-accent/20 rounded-full blur-3xl transition-opacity duration-1000 ${recorder.isRecording && !recorder.isPaused ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative space-y-4">
              <p className="text-[10rem] md:text-[12rem] font-black font-mono tabular-nums text-white tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                {formatTime(recorder.seconds)}
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className={`w-3 h-3 rounded-full ${recorder.isRecording && !recorder.isPaused ? 'bg-accent animate-pulse' : 'bg-white/20'}`} />
                <p className={`text-xl font-black uppercase tracking-[0.3em] ${recorder.isRecording && !recorder.isPaused ? 'text-accent' : 'text-muted-foreground'}`}>
                  {recorder.isRecording
                    ? (recorder.isPaused ? "Pausad" : "Spelar in...")
                    : "Redo för start"}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-12">
            {!recorder.isRecording ? (
              <Button
                size="lg"
                className="w-40 h-40 rounded-[3rem] bg-accent text-white hover:bg-accent/90 shadow-2xl glow-secondary transition-all hover:scale-105 active:scale-95 group"
                onClick={handleStartRecording}
              >
                <Mic className="w-16 h-16 group-hover:scale-110 transition-transform" />
              </Button>
            ) : (
              <div className="flex items-center gap-10">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-24 h-24 rounded-[2rem] glass-button border-white/10 hover:bg-white/10 transition-all"
                  onClick={handlePauseResume}
                >
                  {recorder.isPaused ? (
                    <Play className="w-10 h-10 ml-1 text-primary" />
                  ) : (
                    <Pause className="w-10 h-10 text-white" />
                  )}
                </Button>
                <Button
                  size="lg"
                  className="w-32 h-32 rounded-[2.5rem] bg-destructive text-white hover:bg-destructive/90 shadow-2xl transition-all hover:scale-105 active:scale-95"
                  onClick={handleStopRecording}
                >
                  <Square className="w-12 h-12" />
                </Button>
              </div>
            )}
          </div>

          {/* Status/Instructions */}
          <div className="glass-card px-8 py-4 rounded-2xl inline-flex items-center gap-3 border-white/5">
            <Info className="w-4 h-4 text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {!recorder.isRecording
                ? "Tryck på mikrofonen för att påbörja din AI-lektion"
                : "Tryck på fyrkanten för att avsluta och spara lektionen"}
            </p>
          </div>
        </div>
      </main>

      {/* Title Dialog */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent className="glass-panel border-white/10 max-w-md p-8">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight text-center uppercase">Spara lektion</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Namnge din lektion för att hjälpa eleverna hitta rätt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Lektionstitel *</Label>
              <Input
                placeholder="T.ex. Ekvationer och olikheter"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="h-14 glass-input rounded-xl text-lg border-white/10"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Ämne (valfritt)</Label>
              <Input
                placeholder="T.ex. Matematik"
                value={lessonSubject}
                onChange={(e) => setLessonSubject(e.target.value)}
                className="h-14 glass-input rounded-xl text-lg border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveLesson}
              disabled={!lessonTitle.trim()}
              className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary"
            >
              Slutför och Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GDPR Consent Dialog */}
      <Dialog open={showConsentDialog && !hasConsented} onOpenChange={setShowConsentDialog}>
        <DialogContent className="glass-panel border-white/10 max-w-lg p-10">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto border border-accent/20">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight text-center uppercase">Säker Inspelning</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Viktig information om integritet och AI-hantering.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-white uppercase text-xs tracking-widest">Vad spelas in?</p>
                <p className="text-muted-foreground text-sm">Ljudet bearbetas av AI för att skapa transkription och sammanfattning.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <LockIcon className="w-5 h-5 text-secondary" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-white uppercase text-xs tracking-widest">Vem har tillgång?</p>
                <p className="text-muted-foreground text-sm">Endast du och eleverna i denna specifika klass kan nå materialet.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-white uppercase text-xs tracking-widest">GDPR & Sekretess</p>
                <p className="text-muted-foreground text-sm">Data lagras krypterat inom EU. Du kan radera lektionen när som helst.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-3">
            <Button
              onClick={() => {
                setHasConsented(true);
                setShowConsentDialog(false);
              }}
              className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary"
            >
              Jag förstår, starta
            </Button>
            <Button variant="ghost" onClick={() => navigate("/teacher")} className="w-full h-12 text-muted-foreground font-bold hover:text-white">
              Avbryt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordLesson;
