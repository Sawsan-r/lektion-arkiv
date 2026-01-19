import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Ghost, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Fel: Användaren försökte nå en icke-existerande rutt:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      <div className="max-w-md w-full text-center space-y-12 relative z-10">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <h1 className="text-[12rem] font-black tracking-tighter text-white leading-none relative drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            404
          </h1>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 text-primary">
            <Ghost className="w-8 h-8" />
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">Sidan hittades inte</h2>
          </div>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            Hoppsan! Det verkar som att du har hamnat i ett digitalt tomrum. Sidan du letar efter finns inte längre eller har flyttats.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto h-14 px-8 rounded-xl glass-button border-white/10 font-bold gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Gå tillbaka
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto h-14 px-8 rounded-xl bg-primary text-white font-black glow-primary gap-2"
          >
            <Home className="w-5 h-5" /> Till startsidan
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 text-center w-full">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-30">
          Notera AI – System Error 404
        </p>
      </div>
    </div>
  );
};

export default NotFound;
