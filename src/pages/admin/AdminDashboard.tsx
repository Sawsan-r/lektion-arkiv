import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronRight,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  region: string | null;
  teacher_count: number;
  student_count: number;
  class_count: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgRegion, setNewOrgRegion] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get counts for each organization
      const orgsWithCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          const [teacherResult, classResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id),
            supabase
              .from("classes")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id),
          ]);

          // Get student count from class_members for this org's classes
          const { data: classIds } = await supabase
            .from("classes")
            .select("id")
            .eq("organization_id", org.id);

          let studentCount = 0;
          if (classIds && classIds.length > 0) {
            const { count } = await supabase
              .from("class_members")
              .select("student_id", { count: "exact", head: true })
              .in("class_id", classIds.map(c => c.id));
            studentCount = count || 0;
          }

          return {
            ...org,
            teacher_count: teacherResult.count || 0,
            class_count: classResult.count || 0,
            student_count: studentCount,
          };
        })
      );

      setOrganizations(orgsWithCounts);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({ title: "Fel", description: "Kunde inte hämta organisationer", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: newOrgName,
          region: newOrgRegion || null,
        })
        .select()
        .single();

      if (error) throw error;

      setOrganizations([
        { ...data, teacher_count: 0, class_count: 0, student_count: 0 },
        ...organizations,
      ]);
      setNewOrgName("");
      setNewOrgRegion("");
      setIsCreateOpen(false);
      toast({ title: "Organisation skapad", description: newOrgName });
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({ title: "Fel", description: "Kunde inte skapa organisationen", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteTeacher = async () => {
    if (!inviteEmail.trim() || !selectedOrg) return;
    
    const org = organizations.find(o => o.id === selectedOrg);
    if (!org) return;
    
    setIsSubmitting(true);
    try {
      // Create invitation record
      const { data, error } = await supabase
        .from("teacher_invitations")
        .insert({
          email: inviteEmail,
          organization_id: selectedOrg,
        })
        .select("token")
        .single();

      if (error) throw error;

      const inviteLink = `${window.location.origin}/invite?token=${data.token}`;
      
      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-teacher-invite", {
        body: {
          email: inviteEmail,
          organization_id: selectedOrg,
          organization_name: org.name,
          invite_link: inviteLink,
        },
      });

      if (emailError) {
        console.error("Email sending failed:", emailError);
        // Still copy link to clipboard as fallback
        await navigator.clipboard.writeText(inviteLink);
        toast({ 
          title: "Inbjudan skapad", 
          description: `E-post kunde inte skickas, men länken har kopierats till urklipp.`,
          variant: "destructive"
        });
      } else {
        toast({ 
          title: "Inbjudan skickad!", 
          description: `E-post har skickats till ${inviteEmail}.` 
        });
      }
      
      setInviteEmail("");
      setIsInviteOpen(false);
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast({ title: "Fel", description: "Kunde inte skapa inbjudan", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const totalTeachers = organizations.reduce((a, o) => a + o.teacher_count, 0);
  const totalStudents = organizations.reduce((a, o) => a + o.student_count, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="ghost" size="icon" onClick={handleLogout}>
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
            value={totalTeachers.toString()} 
            label="Lärare" 
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard 
            value={totalStudents.toString()} 
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
                  <div className="space-y-2">
                    <Label>Kommun / Region (valfritt)</Label>
                    <Input
                      placeholder="T.ex. Stockholms län"
                      value={newOrgRegion}
                      onChange={(e) => setNewOrgRegion(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateOrg} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skapa"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {organizations.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Inga organisationer ännu</p>
                <p className="text-sm">Klicka på "Ny skola" för att skapa den första</p>
              </CardContent>
            </Card>
          ) : (
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
                            {org.teacher_count} lärare · {org.student_count} elever
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
                              <Button onClick={handleInviteTeacher} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skicka inbjudan"}
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
          )}
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
