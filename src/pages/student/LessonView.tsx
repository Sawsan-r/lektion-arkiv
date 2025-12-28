import { useState } from "react";
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
  FileText,
  Mic
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Slider } from "@/components/ui/slider";

const LessonView = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([30]);

  const demoSummary = `
## Huvudpunkter

### Ekvationer
- En ekvation är ett matematiskt uttryck som innehåller ett likhetstecken
- Vi kan lösa ekvationer genom att isolera den okända variabeln
- Viktigt att göra samma operation på båda sidor av likhetstecknet

### Uttryck  
- Ett uttryck innehåller variabler och konstanter
- Vi kan förenkla uttryck genom att samla lika termer
- Parenteser löses upp med distributiva lagen

### Praktiska tillämpningar
- Textuppgifter översätts till ekvationer
- Rita figurer kan hjälpa att förstå problemet
- Kontrollera alltid svaret genom att sätta in det i ursprungliga ekvationen

## Viktiga formler
- \`a(b + c) = ab + ac\`
- Lös alltid parenteser först
  `;

  const demoTranscript = `
Okej, nu ska vi titta på ekvationer och uttryck. Det här är ett väldigt viktigt område inom matematiken.

En ekvation är ett matematiskt uttryck som innehåller ett likhetstecken. Till exempel x plus 5 är lika med 10. Vår uppgift är att hitta värdet på x.

För att lösa en ekvation måste vi isolera den okända variabeln. Det gör vi genom att göra samma operation på båda sidor av likhetstecknet.

Låt oss ta ett exempel. Om vi har x plus 5 är lika med 10, så subtraherar vi 5 från båda sidor. Då får vi x är lika med 5.

Nu ska vi titta på uttryck. Ett uttryck är lite annorlunda - det innehåller variabler och konstanter men inget likhetstecken.

Vi kan förenkla uttryck genom att samla lika termer. Till exempel, om vi har 2x plus 3x så blir det 5x.

Glöm inte att alltid kontrollera era svar genom att sätta in dem i den ursprungliga ekvationen!
  `;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Ekvationer och uttryck</h1>
            <p className="text-xs text-muted-foreground">15 jan 2024 · 45 min</p>
          </div>
        </div>
      </header>

      {/* Audio Player */}
      <div className="bg-card border-b p-4">
        <Card className="border-0 shadow-sm bg-secondary/50">
          <CardContent className="p-4 space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <Slider 
                value={progress} 
                onValueChange={setProgress}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>13:30</span>
                <span>45:00</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="icon">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                className="w-14 h-14 rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
              <Button variant="ghost" size="icon">
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="summary" className="h-full flex flex-col">
          <TabsList className="w-full justify-start px-4 py-2 h-auto bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="summary" 
              className="gap-2 data-[state=active]:bg-secondary"
            >
              <FileText className="w-4 h-4" />
              Sammanfattning
            </TabsTrigger>
            <TabsTrigger 
              value="transcript"
              className="gap-2 data-[state=active]:bg-secondary"
            >
              <Mic className="w-4 h-4" />
              Transkription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="flex-1 overflow-auto m-0 p-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-foreground">
                {demoSummary.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('- ')) {
                    return <p key={i} className="ml-4 my-1">• {line.replace('- ', '')}</p>;
                  }
                  if (line.includes('`')) {
                    return (
                      <p key={i} className="my-1">
                        <code className="bg-secondary px-2 py-1 rounded text-sm">
                          {line.replace(/`/g, '')}
                        </code>
                      </p>
                    );
                  }
                  return line ? <p key={i} className="my-1">{line}</p> : null;
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="flex-1 overflow-auto m-0 p-4">
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {demoTranscript}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LessonView;