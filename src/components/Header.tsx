import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import noteraLogo from "@/assets/notera-logo-white.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, roles } = useAuth();

  const getDashboardLink = () => {
    if (roles.includes('system_admin')) return '/admin';
    if (roles.includes('teacher')) return '/teacher';
    if (roles.includes('student')) return '/student';
    return '/auth';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="group">
            <img 
              src={noteraLogo} 
              alt="Notera" 
              className="h-9 w-auto group-hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              Funktioner
            </Link>
            <Link to="/pricing" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              Priser
            </Link>
            <Link to="/about" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              Om oss
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link to={getDashboardLink()}>
                <Button className="h-11 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all glow-primary">
                  Min översikt
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="h-11 px-6 rounded-xl text-muted-foreground hover:text-white font-bold">
                    <LogIn className="w-4 h-4 mr-2" />
                    Logga in
                  </Button>
                </Link>
                <Link to="/join">
                  <Button className="h-11 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all glow-primary">
                    Kom igång
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-6 space-y-4">
            <Link to="/features" className="block py-3 text-lg font-bold text-muted-foreground hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Funktioner
            </Link>
            <Link to="/pricing" className="block py-3 text-lg font-bold text-muted-foreground hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Priser
            </Link>
            <Link to="/about" className="block py-3 text-lg font-bold text-muted-foreground hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Om oss
            </Link>
            <div className="pt-4 border-t border-white/10 space-y-3">
              {user ? (
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-12 rounded-xl bg-primary text-white font-bold">
                    Min översikt
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-12 rounded-xl glass-button border-white/10 font-bold">
                      <LogIn className="w-4 h-4 mr-2" />
                      Logga in
                    </Button>
                  </Link>
                  <Link to="/join" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full h-12 rounded-xl bg-primary text-white font-bold mt-3">
                      Kom igång
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
