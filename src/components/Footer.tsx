import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, GraduationCap, Mail, MapPin, Phone } from "lucide-react";
const Footer = () => {
  return <footer className="w-full border-t border-white/5 bg-black/40 backdrop-blur-2xl mt-auto relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          {/* Brand Section */}
          <div className="md:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-white">Notera</span>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xs">
              Den futuristiska AI-plattformen som transformerar modern utbildning i svenska skolor.
            </p>
            <div className="flex space-x-5">
              {[Github, Twitter, Linkedin].map((Icon, i) => <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/10 transition-all border border-white/5">
                  <Icon className="h-5 w-5" />
                </a>)}
            </div>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Produkt</h4>
            <ul className="space-y-4 text-base font-medium text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Hem
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-primary transition-colors">
                  Funktioner
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary transition-colors">
                  Priser
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Företag</h4>
            <ul className="space-y-4 text-base font-medium text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  Om oss
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Integritetspolicy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="md:col-span-4 space-y-6">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Kontakt</h4>
            <ul className="space-y-4 text-base font-medium text-muted-foreground">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary/60" />
                <span>kontakt@notera.info</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary/60" />
                <span>Kalmar, Sverige</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary/60" />
                <span>+46 (0) 8 123 45 67</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Notera. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              System Status: Optimal
            </span>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;