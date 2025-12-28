import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Demo: Simulate different user roles based on email
    setTimeout(() => {
      setIsLoading(false);
      
      if (email.includes("admin")) {
        toast({ title: "Inloggad som Admin" });
        navigate("/admin");
      } else if (email.includes("larare") || email.includes("teacher")) {
        toast({ title: "Inloggad som Lärare" });
        navigate("/teacher");
      } else {
        toast({ title: "Inloggad som Elev" });
        navigate("/student");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-lg animate-slide-up">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Välkommen tillbaka</CardTitle>
              <CardDescription className="mt-2">
                Logga in för att fortsätta
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="touch-target"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="touch-target pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full touch-target bg-primary"
                disabled={isLoading}
              >
                {isLoading ? "Loggar in..." : "Logga in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Demo-tips:</p>
              <p className="mt-1">
                Använd "admin@", "larare@" eller annan e-post
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;