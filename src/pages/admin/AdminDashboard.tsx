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
  Mail,
  ChevronRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

      const { error: emailError } = await supabase.functions.invoke("send-teacher-invite", {
        body: {
          email: inviteEmail,
          organization_id: selectedOrg,
          organization_name: org.name,
          invite_link: inviteLink,
        },
      });

      if (emailError) {
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

  const totalTeachers = organizations.reduce((a, o) => a + o.teacher_count, 0);
  const totalStudents = organizations.reduce((a, o) => a + o.student_count, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Systemadministratör</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Systemöversikt
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Hantera organisationer och globala systeminställningar.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-8 rounded-xl bg-primary text-white font-black text-lg hover:bg-primary/90 transition-all glow-primary hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3">
              <Plus className="w-6 h-6" /> Ny organisation
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 max-w-md p-8">
            <DialogHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-center">Ny skola</DialogTitle>
              <DialogDescription className="text-center text-lg">
                Lägg till en ny skola eller organisation i systemet.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Skolans namn</Label>
                <Input
                  placeholder="T.ex. Sundbybergs Gymnasium"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="h-14 glass-input rounded-xl text-lg border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Region (valfritt)</Label>
                <Input
                  placeholder="T.ex. Stockholm"
                  value={newOrgRegion}
                  onChange={(e) => setNewOrgRegion(e.target.value)}
                  className="h-14 glass-input rounded-xl text-lg border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateOrg} className="w-full h-14 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Skapa organisation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Organisationer", value: organizations.length, icon: Building2, color: "text-primary" },
          { label: "Totala Lärare", value: totalTeachers, icon: Users, color: "text-secondary" },
          { label: "Totala Elever", value: totalStudents, icon: GraduationCap, color: "text-accent" },
          { label: "Systemhälsa", value: "99.9%", icon: Globe, color: "text-green-400" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-8 rounded-3xl flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} border border-white/5`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Organizations Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Organisationer</h2>
          <div className="h-[1px] flex-1 bg-white/5 mx-6 hidden md:block" />
        </div>

        {organizations.length === 0 ? (
          <div className="glass-panel p-20 rounded-[3rem] text-center space-y-6 border-dashed border-2 border-white/5">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Building2 className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Inga organisationer</h3>
              <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                Lägg till din första skola för att börja hantera systemet.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {organizations.map((org, index) => (
              <div
                key={org.id}
                className="glass-card p-8 rounded-[2rem] group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <Building2 className="w-32 h-32 text-white" />
                </div>

                <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl text-white tracking-tight group-hover:text-primary transition-colors">{org.name}</h3>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                          Region: {org.region || "Ej angiven"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={isInviteOpen && selectedOrg === org.id} onOpenChange={(open) => {
                        setIsInviteOpen(open);
                        if (open) setSelectedOrg(org.id);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl glass-button border-white/10 hover:bg-white/10">
                            <Mail className="w-5 h-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-panel border-white/10 max-w-md p-8">
                          <DialogHeader className="space-y-4">
                            <DialogTitle className="text-2xl font-black tracking-tight text-center">Bjud in lärare</DialogTitle>
                            <DialogDescription className="text-center text-base">
                              Skicka en inbjudan till en lärare på {org.name}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-6 space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Lärarens e-post</Label>
                            <Input
                              type="email"
                              placeholder="larare@skola.se"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="h-14 glass-input rounded-xl text-lg border-white/10"
                            />
                          </div>
                          <DialogFooter>
                            <Button onClick={handleInviteTeacher} className="w-full h-14 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all glow-primary" disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Skicka inbjudan"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/5">
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Lärare</span>
                      </div>
                      <div className="text-xl font-black text-white">{org.teacher_count}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Elever</span>
                      </div>
                      <div className="text-xl font-black text-white">{org.student_count}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Klasser</span>
                      </div>
                      <div className="text-xl font-black text-white">{org.class_count}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
