import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  Sparkles,
  Check,
  Zap,
  Building2,
  Users,
  Mail,
} from "lucide-react";

const plans = [
  {
    name: "Grundskola",
    description: "För enskilda skolor som vill komma igång",
    price: "Gratis",
    priceNote: "under pilotperioden",
    features: [
      "Obegränsade lektionsinspelningar",
      "AI-transkription och sammanfattning",
      "Upp till 50 elever",
      "5 lärarklasser",
      "E-postsupport",
    ],
    cta: "Kontakta oss",
    ctaLink: "/contact?subject=pilot",
    highlighted: false,
  },
  {
    name: "Skola Pro",
    description: "För hela skolan med fler funktioner",
    price: "Kontakta oss",
    priceNote: "för prisuppgift",
    features: [
      "Allt i Grundskola",
      "Obegränsat antal elever",
      "Obegränsat antal lärare",
      "Prioriterad support",
      "Anpassad onboarding",
      "Avancerad statistik",
    ],
    cta: "Kontakta oss",
    ctaLink: "/contact?subject=pro",
    highlighted: true,
  },
  {
    name: "Kommun",
    description: "För hela kommunen eller skolkoncernen",
    price: "Enterprise",
    priceNote: "anpassat avtal",
    features: [
      "Allt i Skola Pro",
      "Fleranvändarhantering",
      "SSO-integration",
      "Dedikerad kontaktperson",
      "SLA-avtal",
      "Anpassade integrationer",
    ],
    cta: "Boka demo",
    ctaLink: "/contact?subject=demo",
    highlighted: false,
  },
];

const Pricing = () => {
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
            <span className="text-sm font-black uppercase tracking-[0.2em]">Priser</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
            Enkla och<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              Transparenta Priser
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Välj den plan som passar din skola. Alla planer inkluderar våra kärnfunktioner 
            för AI-driven lektionshantering.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`glass-panel relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                plan.highlighted 
                  ? "border-primary/50 ring-2 ring-primary/20" 
                  : "border-white/10"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
              )}
              <CardHeader className="text-center pt-10 pb-6">
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                  plan.highlighted ? "bg-primary/20" : "bg-white/5"
                }`}>
                  {index === 0 ? (
                    <Users className={`w-8 h-8 ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`} />
                  ) : index === 1 ? (
                    <Zap className="w-8 h-8 text-primary" />
                  ) : (
                    <Building2 className={`w-8 h-8 ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-white">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground text-lg">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-8">
                <div className="text-center">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <p className="text-sm text-muted-foreground mt-1">{plan.priceNote}</p>
                </div>
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-14 rounded-xl font-black text-lg transition-all ${
                    plan.highlighted
                      ? "bg-primary text-white hover:bg-primary/90 glow-primary"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                  asChild
                >
                  <Link to={plan.ctaLink}>
                    <Mail className="w-5 h-5 mr-2" />
                    {plan.cta}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-black tracking-tighter text-white">Har du frågor?</h2>
          <p className="text-lg text-muted-foreground">
            Kontakta oss på{" "}
            <a href="mailto:kontakt@notera.se" className="text-primary hover:underline font-bold">
              kontakt@notera.se
            </a>{" "}
            så hjälper vi dig att hitta rätt lösning för din skola.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
