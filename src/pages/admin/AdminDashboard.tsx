import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Building2, 
  Users, 
  Plus, 
  LogOut, 
  Mail,
  GraduationCap,
  ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Demo data
const demoOrganizations = [
  { id: "1", name: "Sundbybergs Gymnasium", teachers: 12, classes: 8, students: 245 },
  { id: "2", name: "Vallentuna Skola", teachers: 8, classes: 5, students: 156 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState(demoOrganizations);
  const [newOrgName, setNewOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) return;
    
    setOrganizations([
      ...organizations,
      { 
        id: Date.now().toString(), 
        name: newOrgName, 
        teachers: 0, 
        classes: 0, 
        students: 0 
      }
    ]);
    setNewOrgName("");
    setIsCreateOpen(false);
    toast({ title: "Organisation skapad", description: newOrgName });
  };

  const handleInviteTeacher = () => {
    if (!inviteEmail.trim() || !selectedOrg) return;
    
    toast({ 
      title: "Inbjudan skickad", 
      description: `E-post skickad till ${inviteEmail}` 
    });
    setInviteEmail("");
    setIsInviteOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">System Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard 
            value={organizations.length.toString()} 
            label="Skolor" 
            icon={<Building2 className="w-4 h-4" />}
          />
          <StatCard 
            value={organizations.reduce((a, o) => a + o.teachers, 0).toString()} 
            label="Lärare" 
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard 
            value={organizations.reduce((a, o) => a + o.students, 0).toString()} 
            label="Elever" 
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        {/* Organizations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Organisationer</h2>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Ny skola
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skapa organisation</DialogTitle>
                  <DialogDescription>
                    Lägg till en ny skola i systemet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Skolans namn</Label>
                    <Input
                      placeholder="T.ex. Sundbybergs Gymnasium"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateOrg}>Skapa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {organizations.map((org) => (
              <Card key={org.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {org.teachers} lärare · {org.students} elever
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={isInviteOpen && selectedOrg === org.id} onOpenChange={(open) => {
                        setIsInviteOpen(open);
                        if (open) setSelectedOrg(org.id);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Bjud in lärare</DialogTitle>
                            <DialogDescription>
                              Skicka inbjudan till {org.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Lärarens e-post</Label>
                              <Input
                                type="email"
                                placeholder="larare@skola.se"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleInviteTeacher}>
                              Skicka inbjudan
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ 
  value, 
  label, 
  icon 
}: { 
  value: string; 
  label: string; 
  icon: React.ReactNode; 
}) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-primary mb-1">
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default AdminDashboard;