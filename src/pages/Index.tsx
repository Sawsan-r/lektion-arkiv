import { Link } from "react-router-dom";
import { ArrowRight, Play, Shield, Zap, Sparkles, Cpu, Globe } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-[0.07]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground tracking-wide">AI-DRIVET LÄRANDE FÖR SVENSKA SKOLOR</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 text-balance leading-[0.9]">
            Framtidens <br />
            <span className="neon-text">Klassrum</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 text-balance leading-relaxed">
            Revolutionera din undervisning med AI-drivna insikter. Notera transkriberar, sammanfattar och analyserar dina lektioner i realtid – så att du kan fokusera på eleverna.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/invite">
              <Button size="lg" className="h-16 px-10 rounded-full bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all glow-primary hover:-translate-y-1 flex items-center gap-3">
                Börja undervisa <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
            <Link to="/join">
              <Button variant="outline" size="lg" className="h-16 px-10 rounded-full glass-button border-white/10 text-white font-bold text-lg hover:bg-white/10 flex items-center gap-3">
                Gå med i klass <Play className="w-6 h-6 fill-current" />
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-24 max-w-5xl mx-auto border-t border-white/10 pt-12">
            {[
              { label: "Aktiva användare", value: "10k+", icon: Globe },
              { label: "Inspelade lektioner", value: "50k+", icon: Play },
              { label: "AI-precision", value: "99.9%", icon: Cpu },
              { label: "Sparad tid", value: "1000h+", icon: Zap },
            ].map((stat, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 group">
                <stat.icon className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors mb-2" />
                <div className="text-4xl font-black text-white tracking-tighter">{stat.value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative bg-black/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Drivs av <span className="text-secondary">Nästa Generations AI</span></h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upplev funktioner designade för det moderna utbildningslandskapet i Sverige.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: <Zap className="w-10 h-10 text-secondary" />,
                title: "Omedelbar transkribering",
                description: "Avancerad tal-till-text i realtid med fullt stöd för svenska och automatisk talardetektering."
              },
              {
                icon: <Shield className="w-10 h-10 text-primary" />,
                title: "Säker lagring",
                description: "Kryptering i företagsklass och full GDPR-efterlevnad säkerställer att all skolans data förblir privat."
              },
              {
                icon: <Sparkles className="w-10 h-10 text-accent" />,
                title: "Smarta sammanfattningar",
                description: "AI-genererade nyckelpunkter, begreppsförklaringar och åtgärdspunkter från varje lektion."
              }
            ].map((feature, index) => (
              <div key={index} className="glass-card p-10 rounded-3xl group">
                <div className="mb-8 p-5 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="glass-panel p-16 md:p-24 rounded-[3rem] text-center max-w-5xl mx-auto border border-white/20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />

            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter leading-none">Redo att uppgradera <br />ditt klassrum?</h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Gå med i tusentals framsynta pedagoger som använder Notera för att skapa framtidens skola idag.
            </p>
            <Link to="/auth">
              <Button size="lg" className="h-16 px-12 rounded-full bg-white text-black font-black text-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl">
                Kom igång nu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;