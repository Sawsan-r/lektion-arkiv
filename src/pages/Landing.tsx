import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, Mic, Play, ChevronRight, Sparkles, GraduationCap, ArrowRight, BookOpen, BrainCircuit } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-[160px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="p-8 md:p-12 flex items-center justify-between relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center glow-primary">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-white uppercase">Notera</span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="font-black uppercase tracking-widest text-xs hover:bg-white/5 text-white"
          >
            Logga in
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            className="hidden md:flex h-12 px-6 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs glow-primary"
          >
            Kom igång
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-4xl w-full text-center space-y-12">
          {/* Badge */}
          <div className="animate-in fade-in zoom-in duration-1000">
            <span className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-black uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(168,85,247,1)]" />
              Framtidens lärande är här
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter text-balance uppercase">
              Missa aldrig en <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">lektion</span> igen
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance font-medium leading-relaxed">
              Spela in, transkribera och sammanfatta dina lektioner med kraftfull AI.
              Skapat exklusivt för svenska skolor och lärare.
            </p>
          </div>

          {/* CTA Area */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
            <Button
              size="lg"
              className="w-full sm:w-auto h-20 px-12 rounded-[2rem] bg-primary text-white font-black text-2xl hover:bg-primary/90 glow-primary transition-all hover:scale-105 active:scale-95 group"
              onClick={() => navigate("/auth")}
            >
              Starta gratis nu
              <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-2" />
            </Button>
            <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-white">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Används av <span className="text-white">500+</span> lärare
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600">
            <FeatureCard
              icon={<Mic className="w-8 h-8" />}
              title="Smart Inspelning"
              description="Högkvalitativt ljud som fångar varje viktigt ord under lektionen."
              color="primary"
            />
            <FeatureCard
              icon={<BrainCircuit className="w-8 h-8" />}
              title="AI-Analys"
              description="Automatiska sammanfattningar och nyckelbegrepp på sekunder."
              color="secondary"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Säker & Trygg"
              description="Fullt GDPR-kompatibel och anpassad för skolans krav."
              color="accent"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-12 text-center relative z-10">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />
        <p className="text-xs font-black uppercase tracking-[0.5em] text-muted-foreground">
          © 2026 Notera AI – Utvecklat för den svenska skolan
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'secondary' | 'accent';
}) => (
  <Card className="glass-card border-white/5 p-8 rounded-[2.5rem] group hover:bg-white/[0.03] transition-all duration-500">
    <CardContent className="p-0 space-y-6 text-left">
      <div className={`w-16 h-16 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color} group-hover:scale-110 transition-transform duration-500 border border-${color}/20`}>
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-white tracking-tight uppercase">{title}</h3>
        <p className="text-muted-foreground font-medium leading-relaxed">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default Landing;
