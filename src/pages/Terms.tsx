import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ShieldCheck } from "lucide-react";

const Terms = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />

            <Header />

            <div className="container mx-auto px-4 pt-32 pb-12 flex-grow relative z-10">
                <div className="max-w-4xl mx-auto glass-panel p-12 md:p-16 rounded-[2.5rem] border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">Användarvillkor</h1>
                    </div>

                    <div className="space-y-10 text-lg text-muted-foreground leading-relaxed">
                        <p className="font-bold text-white/60 uppercase tracking-widest text-sm">Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</p>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">1. Godkännande av villkor</h2>
                            <p>
                                Genom att komma åt och använda Notera, accepterar och godkänner du att vara bunden av villkoren och bestämmelserna i detta avtal. Våra tjänster är utformade för att stödja det svenska utbildningssystemet med högsta standard för integritet och säkerhet.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">2. Användarlicens</h2>
                            <p>
                                Tillstånd ges att använda Noteras plattform för utbildningsändamål. Detta är en beviljande av en licens, inte en överföring av äganderätt, och under denna licens får du inte använda tjänsten för kommersiella ändamål utanför den avsedda utbildningskontexten.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">3. AI-användning och Data</h2>
                            <p>
                                Vår tjänst använder avancerad artificiell intelligens för att transkribera och analysera lektioner. Genom att använda Notera samtycker du till att ljuddata behandlas av våra AI-modeller för att generera sammanfattningar och insikter. All data behandlas med strikt sekretess.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">4. Ansvar och Garantier</h2>
                            <p>
                                Notera strävar efter 100% precision i våra AI-genererade sammanfattningar, men vi rekommenderar alltid att lärare och elever granskar kritiskt innehåll. Tjänsten tillhandahålls för att underlätta lärande och dokumentation.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Terms;
