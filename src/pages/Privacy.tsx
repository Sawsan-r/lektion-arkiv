import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Lock } from "lucide-react";

const Privacy = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />

            <Header />

            <div className="container mx-auto px-4 pt-32 pb-12 flex-grow relative z-10">
                <div className="max-w-4xl mx-auto glass-panel p-12 md:p-16 rounded-[2.5rem] border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                            <Lock className="w-6 h-6 text-secondary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">Integritetspolicy</h1>
                    </div>

                    <div className="space-y-10 text-lg text-muted-foreground leading-relaxed">
                        <p className="font-bold text-white/60 uppercase tracking-widest text-sm">Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</p>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">1. Datainsamling och GDPR</h2>
                            <p>
                                Vi samlar in information som är nödvändig för att tillhandahålla våra AI-tjänster. Detta inkluderar profilinformation och ljudupptagningar från lektioner. Vi följer strikt GDPR-riktlinjer för att säkerställa att all data hanteras säkert inom EU/EES.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">2. Hur vi använder din data</h2>
                            <p>
                                Din data används uteslutande för att generera transkriptioner och sammanfattningar åt dig och din klass. Vi säljer aldrig din data till tredje part och vi använder inte dina lektioner för att träna globala AI-modeller utan explicit samtycke.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">3. Datasäkerhet</h2>
                            <p>
                                Vi använder kryptering i företagsklass (AES-256) för att skydda all lagrad data. Vår infrastruktur är designad för att vara resilient och säker mot obehörig åtkomst, vilket är kritiskt för skolmiljön.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">4. Dina rättigheter</h2>
                            <p>
                                Du har rätt att när som helst begära utdrag av din data, korrigera felaktigheter eller begära radering av ditt konto och tillhörande data. Kontakta oss på <span className="text-primary font-bold">privacy@notera.se</span> för assistans.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Privacy;
