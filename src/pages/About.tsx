import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { Target, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow delay-1000" />

            <Header />

            <div className="container mx-auto px-4 pt-32 pb-12 flex-grow relative z-10">
                <div className="max-w-5xl mx-auto space-y-20">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
                            <Sparkles className="w-4 h-4 text-secondary" />
                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Vår Vision</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
                            Om <span className="neon-text">Notera</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Vi revolutionerar utbildning genom att kombinera mänsklig pedagogik med nästa generations artificiell intelligens.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="glass-card p-10 rounded-[2rem] space-y-6 group">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Target className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">Vårt uppdrag</h2>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                                Vi tror att framtidens utbildning ligger i den sömlösa integrationen av mänsklig kreativitet och AI.
                                Notera är utformat för att stärka lärare och elever genom att ta bort administrativa hinder, så att de kan fokusera på det som verkligen betyder något: det djupa lärandet.
                            </p>
                        </div>
                        <div className="glass-card p-10 rounded-[2rem] space-y-6 group">
                            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Rocket className="w-8 h-8 text-secondary" />
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">Teknologin</h2>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                                Byggd på den absoluta framkanten av webbteknologi, använder vår plattform avancerade AI-modeller för att transkribera, sammanfatta och organisera utbildningsinnehåll i realtid.
                                Säkert, snabbt och optimerat för den svenska skolmiljön.
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel p-16 md:p-24 rounded-[3rem] text-center space-y-10 relative overflow-hidden border border-white/20">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <ShieldCheck className="w-64 h-64 text-white" />
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Gå med i revolutionen</h2>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Upplev framtidens klassrumshantering idag. Oavsett om du är lärare, elev eller administratör, anpassar sig Notera efter dina unika behov.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                            <Link to="/join">
                                <Button variant="outline" size="lg" className="h-16 px-10 rounded-full glass-button border-white/10 text-white font-bold text-lg w-full sm:w-auto">
                                    Gå med som elev
                                </Button>
                            </Link>
                            <Link to="/invite">
                                <Button size="lg" className="h-16 px-10 rounded-full bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all glow-primary w-full sm:w-auto">
                                    Läraråtkomst
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default About;
