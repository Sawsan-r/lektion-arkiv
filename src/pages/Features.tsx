import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  Mic,
  FileText,
  Sparkles,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  Brain,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Ljudinspelning",
    description: "Spela in lektioner direkt i webbläsaren med kristallklar ljudkvalitet. Stöder långa inspelningar.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    icon: FileText,
    title: "AI-Transkription",
    description: "Automatisk omvandling av tal till text med hög precision. Stöder svenska och andra språk.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  },
  {
    icon: Sparkles,
    title: "Smarta Sammanfattningar",
    description: "AI genererar koncisa sammanfattningar av varje lektion med nyckelbegrepp och huvudpunkter.",
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
  },
  {
    icon: Users,
    title: "Klasshantering",
    description: "Skapa klasser, bjud in elever med QR-koder, och organisera lektioner enkelt.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    icon: Brain,
    title: "Intelligent Lärande",
    description: "AI-driven analys hjälper elever att förstå och minnas lektionsinnehåll bättre.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  },
  {
    icon: Shield,
    title: "Säker & Privat",
    description: "All data krypteras och lagras säkert. GDPR-kompatibel för svenska skolor.",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
  },
];

const benefits = [
  "Spara timmar på anteckningar varje vecka",
  "Elever kan fokusera på att lyssna istället för att skriva",
  "Gå tillbaka och repetera svåra moment när som helst",
  "Perfekt för elever med inlärningssvårigheter",
  "Ingen installation krävs – fungerar direkt i webbläsaren",
  "Svenska AI-modeller för bästa precision",
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Funktioner</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
            AI-Kraftfull<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              Klassrumshantering
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Allt du behöver för att spela in, transkribera och sammanfatta lektioner – 
            automatiskt och intelligent.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`glass-panel border ${feature.borderColor} hover:scale-[1.02] transition-all duration-300`}
            >
              <CardContent className="p-8 space-y-6">
                <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white">{feature.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-panel border-white/10">
            <CardContent className="p-12 space-y-10">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-[2rem] bg-secondary/10 flex items-center justify-center mx-auto border border-secondary/20">
                  <Zap className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-white">Varför Notera?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                    <span className="text-lg text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-black tracking-tighter text-white">
            Redo att komma igång?
          </h2>
          <p className="text-xl text-muted-foreground">
            Börja använda Notera idag och förändra hur din skola hanterar lektioner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-8 rounded-xl bg-primary text-white font-black text-lg hover:bg-primary/90 glow-primary"
              asChild
            >
              <Link to="/auth">
                <BookOpen className="w-5 h-5 mr-2" />
                Skapa konto
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 rounded-xl border-white/10 bg-white/5 text-white font-black text-lg hover:bg-white/10"
              asChild
            >
              <Link to="/pricing">Se priser</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
