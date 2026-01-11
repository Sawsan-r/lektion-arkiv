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
  Loader2
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
    // Show dialog to get lesson title before stopping
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
      // Stop recording and get audio blob
      const audioBlob = await recorder.stopRecording();
      console.log("Recording stopped, blob size:", audioBlob?.size || 0);
      
      // Create lesson record
      console.log("Creating lesson record for class:", classId);
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

      if (lessonError) {
        console.error("Lesson insert error:", lessonError);
        throw new Error(`Kunde inte skapa lektion: ${lessonError.message}`);
      }

      console.log("Lesson created:", lesson.id);
      setCreatedLessonId(lesson.id);

      // Upload audio if we have it
      if (audioBlob && audioBlob.size > 0) {
        const fileName = `${lesson.id}.webm`;
        console.log("Uploading audio file:", fileName, "size:", audioBlob.size);
        
        const { error: uploadError } = await supabase.storage
          .from("lesson-audio")
          .upload(fileName, audioBlob, {
            contentType: "audio/webm",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Delete the lesson record since audio upload failed
          await supabase.from("lessons").delete().eq("id", lesson.id);
          throw new Error(`Kunde inte ladda upp ljudfilen: ${uploadError.message}`);
        }
        
        console.log("Audio uploaded, updating lesson with audio_url");
        
        // Store the file path (not URL) - we'll generate signed URLs when needed
        const { error: updateError } = await supabase
          .from("lessons")
          .update({ audio_url: fileName })
          .eq("id", lesson.id);
        
        if (updateError) {
          console.error("Update audio_url error:", updateError);
          throw new Error(`Kunde inte uppdatera lektion: ${updateError.message}`);
        }
      }

      // Trigger AI processing in background
      try {
        console.log("Triggering AI processing for lesson:", lesson.id);
        const { data, error: invokeError } = await supabase.functions.invoke("process-lesson", {
          body: { lessonId: lesson.id },
        });
        
        if (invokeError) {
          console.error("AI processing invoke error:", invokeError);
          // Update status to ready even if AI fails so the lesson is accessible
          await supabase
            .from("lessons")
            .update({ status: "ready" })
            .eq("id", lesson.id);
        } else {
          console.log("AI processing triggered successfully:", data);
        }
      } catch (aiError) {
        console.error("AI processing exception:", aiError);
        // Update status to ready even if AI fails
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
      const errorMessage = error instanceof Error ? error.message : "Kunde inte spara lektionen";
      toast({ 
        title: "Fel", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg animate-scale-in">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">Lektion sparad!</h1>
              <p className="text-lg text-muted-foreground">
                {lessonTitle} • {formatTime(recorder.seconds)}
              </p>
              <p className="text-sm text-muted-foreground">
                AI-sammanfattning och transkribering bearbetas. 
                Eleverna får tillgång när det är klart.
              </p>
            </div>
            <Button 
              className="w-full touch-target font-semibold"
              onClick={() => navigate("/teacher")}
            >
              Tillbaka till klasser
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Sparar...</h1>
              <p className="text-muted-foreground">
                Laddar upp inspelning och förbereder AI-analys
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 safe-area-top flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {className && (
          <span className="font-medium text-muted-foreground">{className}</span>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-10 text-center">
          {/* Error message */}
          {recorder.error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{recorder.error}</p>
              </CardContent>
            </Card>
          )}

          {/* Timer */}
          <div className="space-y-3">
            <p className="text-7xl font-bold font-mono tabular-nums text-foreground">
              {formatTime(recorder.seconds)}
            </p>
            <p className={`text-lg font-medium ${recorder.isRecording && !recorder.isPaused ? 'text-accent' : 'text-muted-foreground'}`}>
              {recorder.isRecording 
                ? (recorder.isPaused ? "Pausad" : "Spelar in...") 
                : "Redo att spela in"}
            </p>
          </div>

          {/* Recording Button */}
          <div className="flex flex-col items-center gap-6">
            {!recorder.isRecording ? (
              <Button
                size="lg"
                className="w-36 h-36 rounded-full bg-accent hover:bg-accent/90 shadow-xl btn-glow"
                onClick={handleStartRecording}
              >
                <Mic className="w-14 h-14" />
              </Button>
            ) : (
              <div className="flex items-center gap-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-20 h-20 rounded-full border-2"
                  onClick={handlePauseResume}
                >
                  {recorder.isPaused ? (
                    <Play className="w-8 h-8 ml-1" />
                  ) : (
                    <Pause className="w-8 h-8" />
                  )}
                </Button>
                <Button
                  size="lg"
                  className="w-28 h-28 rounded-full bg-destructive hover:bg-destructive/90 shadow-xl animate-pulse-record"
                  onClick={handleStopRecording}
                >
                  <Square className="w-12 h-12" />
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2">
            {!recorder.isRecording ? (
              <>
                <p className="font-medium">Tryck på mikrofonen för att börja</p>
                <p>Hela lektionen sparas och transkriberas automatiskt</p>
              </>
            ) : (
              <>
                <p className="font-medium">Tryck på stopp när lektionen är klar</p>
                <p>Du kan pausa inspelningen om du behöver</p>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Title Dialog */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spara lektion</DialogTitle>
            <DialogDescription>
              Ge lektionen ett namn så eleverna vet vad den handlar om
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lektionstitel *</Label>
              <Input
                placeholder="T.ex. Ekvationer och olikheter"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Ämne (valfritt)</Label>
              <Input
                placeholder="T.ex. Matematik"
                value={lessonSubject}
                onChange={(e) => setLessonSubject(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTitleDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveLesson} disabled={!lessonTitle.trim()}>
              Spara lektion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GDPR Consent Dialog */}
      <Dialog open={showConsentDialog && !hasConsented} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Samtycke till inspelning</DialogTitle>
            <DialogDescription>
              Viktigt information innan du börjar spela in
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Vad spelas in?</strong><br />
              Hela lektionens ljud sparas och bearbetas av AI för att skapa transkription och sammanfattning.
            </p>
            <p>
              <strong className="text-foreground">Vem har tillgång?</strong><br />
              Endast du (läraren) och elever som är med i denna klass kan se och lyssna på lektionen.
            </p>
            <p>
              <strong className="text-foreground">GDPR & Sekretess</strong><br />
              All data lagras säkert och i enlighet med GDPR. Du kan när som helst radera en lektion.
            </p>
            <p className="text-xs">
              Genom att fortsätta bekräftar du att du har informerat deltagarna om inspelningen.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate("/teacher")} className="w-full sm:w-auto">
              Avbryt
            </Button>
            <Button 
              onClick={() => {
                setHasConsented(true);
                setShowConsentDialog(false);
              }}
              className="w-full sm:w-auto"
            >
              Jag förstår, fortsätt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordLesson;
