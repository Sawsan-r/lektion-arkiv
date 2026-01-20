import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Bell, Shield, Database, Mail, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Inställningar sparade",
      description: "Dina ändringar har sparats.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-white">Inställningar</h1>
        <p className="text-lg text-muted-foreground">Hantera systemets inställningar och konfigurationer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white">Allmänt</CardTitle>
                <CardDescription>Grundläggande systeminställningar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Organisationsnamn</Label>
              <Input
                defaultValue="Notera Demo"
                className="h-12 glass-input rounded-xl border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Kontakt e-post</Label>
              <Input
                defaultValue="kontakt@notera.se"
                className="h-12 glass-input rounded-xl border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white">AI-inställningar</CardTitle>
                <CardDescription>Konfigurera AI-funktionalitet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-bold text-white">Automatisk sammanfattning</Label>
                <p className="text-sm text-muted-foreground">Generera sammanfattningar automatiskt efter transkription</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-bold text-white">Svenska språkmodell</Label>
                <p className="text-sm text-muted-foreground">Prioritera svenska för transkription</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white">Notifikationer</CardTitle>
                <CardDescription>Hantera e-postnotifikationer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-bold text-white">Nya registreringar</Label>
                <p className="text-sm text-muted-foreground">Skicka e-post vid nya användarregistreringar</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-bold text-white">Veckorapport</Label>
                <p className="text-sm text-muted-foreground">Skicka veckovis sammanfattning till admins</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white">Säkerhet</CardTitle>
                <CardDescription>Säkerhetsinställningar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-bold text-white">Tvåfaktorsautentisering</Label>
                <p className="text-sm text-muted-foreground">Kräv 2FA för administratörer</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-bold text-white">Sessionstimeout</Label>
                <p className="text-sm text-muted-foreground">Logga ut användare efter inaktivitet</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="h-14 px-8 rounded-xl bg-primary text-white font-black text-lg hover:bg-primary/90 glow-primary"
        >
          Spara ändringar
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
