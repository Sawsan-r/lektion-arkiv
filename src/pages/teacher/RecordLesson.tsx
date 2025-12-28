import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Mic, 
  Square, 
  Pause, 
  Play,
  CheckCircle2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const RecordLesson = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { toast } = useToast();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    toast({ title: "Inspelning startad" });
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      toast({ 
        title: "Lektion sparad!", 
        description: "AI-sammanfattning skapas i bakgrunden" 
      });
    }, 3000);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg animate-slide-up">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Lektion sparad!</h1>
              <p className="text-muted-foreground">
                Längd: {formatTime(seconds)}
              </p>
              <p className="text-sm text-muted-foreground">
                AI-sammanfattning och transkribering bearbetas. 
                Eleverna får tillgång när det är klart.
              </p>
            </div>
            <Button 
              className="w-full touch-target"
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
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Bearbetar...</h1>
              <p className="text-muted-foreground">
                Sparar inspelning och förbereder AI-analys
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
      <header className="p-4 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Timer */}
          <div className="space-y-2">
            <p className="text-6xl font-bold font-mono tabular-nums">
              {formatTime(seconds)}
            </p>
            <p className="text-muted-foreground">
              {isRecording 
                ? (isPaused ? "Pausad" : "Spelar in...") 
                : "Redo att spela in"}
            </p>
          </div>

          {/* Recording Button */}
          <div className="flex flex-col items-center gap-4">
            {!isRecording ? (
              <Button
                size="lg"
                className="w-32 h-32 rounded-full bg-accent hover:bg-accent/90 shadow-lg"
                onClick={handleStartRecording}
              >
                <Mic className="w-12 h-12" />
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-20 h-20 rounded-full"
                  onClick={handlePauseResume}
                >
                  {isPaused ? (
                    <Play className="w-8 h-8" />
                  ) : (
                    <Pause className="w-8 h-8" />
                  )}
                </Button>
                <Button
                  size="lg"
                  className="w-24 h-24 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg animate-pulse-record"
                  onClick={handleStopRecording}
                >
                  <Square className="w-10 h-10" />
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-1">
            {!isRecording ? (
              <>
                <p>Tryck på mikrofonen för att börja spela in</p>
                <p>Hela lektionen sparas och transkriberas automatiskt</p>
              </>
            ) : (
              <>
                <p>Tryck på stoppknappen när lektionen är klar</p>
                <p>Du kan pausa inspelningen om du behöver</p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecordLesson;