import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, Shield, Mic, Play, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-4 md:p-6 flex items-center justify-between animate-slide-down">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">LektionsLyft</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            onClick={() => navigate("/auth")}
            className="font-medium"
          >
            Logga in
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Badge */}
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Gratis beta – Prova nu
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight text-balance">
              Missa aldrig en{" "}
              <span className="gradient-text">lektion</span>{" "}
              igen
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto text-balance">
              Spela in, transkribera och sammanfatta lektioner med AI. 
              Perfekt för svenska skolor.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 py-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <FeatureCard 
              icon={<Mic className="w-5 h-5" />}
              title="Spela in"
              description="Hela lektionen"
              delay={0}
            />
            <FeatureCard 
              icon={<GraduationCap className="w-5 h-5" />}
              title="AI-sammanfattning"
              description="Automatiskt"
              delay={1}
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5" />}
              title="Dela med elever"
              description="Enkelt & tryggt"
              delay={2}
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5" />}
              title="GDPR-säkert"
              description="För skolor"
              delay={3}
            />
          </div>

          {/* CTA */}
          <div className="space-y-4 pt-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              className="w-full touch-target text-lg font-semibold bg-accent hover:bg-accent/90 btn-glow group"
              onClick={() => navigate("/auth")}
            >
              Kom igång gratis
              <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Ingen kreditkort krävs
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground safe-area-bottom">
        <p>© 2024 LektionsLyft UF – För svenska skolor</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay?: number;
}) => (
  <Card 
    className="border-0 shadow-md card-hover bg-card"
    style={{ animationDelay: `${delay * 0.05}s` }}
  >
    <CardContent className="p-4 text-center space-y-2">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto text-primary">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default Landing;
