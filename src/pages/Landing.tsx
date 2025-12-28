import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, Shield, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">LektionsLyft</span>
        </div>
        <Button variant="ghost" onClick={() => navigate("/auth")}>
          Logga in
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center space-y-6 animate-slide-up">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Missa aldrig en lektion igen
            </h1>
            <p className="text-muted-foreground text-lg">
              Spela in, transkribera och sammanfatta lektioner med AI. 
              Perfekt för svenska skolor.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 py-4">
            <FeatureCard 
              icon={<Mic className="w-5 h-5" />}
              title="Spela in"
              description="Hela lektionen"
            />
            <FeatureCard 
              icon={<GraduationCap className="w-5 h-5" />}
              title="AI-sammanfattning"
              description="Automatiskt"
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5" />}
              title="Dela med elever"
              description="Enkelt & tryggt"
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5" />}
              title="GDPR-säkert"
              description="För skolor"
            />
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-4">
            <Button 
              size="lg" 
              className="w-full touch-target text-lg bg-accent hover:bg-accent/90"
              onClick={() => navigate("/auth")}
            >
              Kom igång
            </Button>
            <p className="text-sm text-muted-foreground">
              Gratis under betaperioden
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground safe-area-bottom">
        © 2024 LektionsLyft UF
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-4 text-center space-y-1">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mx-auto text-primary">
        {icon}
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default Landing;