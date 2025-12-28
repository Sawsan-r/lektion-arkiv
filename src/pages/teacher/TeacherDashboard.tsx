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
  Users, 
  Plus, 
  LogOut, 
  Mic,
  GraduationCap,
  ChevronRight,
  QrCode as QrCodeIcon,
  BookOpen,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

interface ClassData {
  id: string;
  name: string;
  join_code: string;
  student_count: number;
  lesson_count: number;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, organizations(name)")
      .eq("id", user.id)
      .single();

    if (profile?.organizations) {
      setOrganizationName((profile.organizations as { name: string }).name);
    }
  };

  const fetchClasses = async () => {
    if (!user) return;

    try {
      const { data: classData, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get counts for each class
      const classesWithCounts = await Promise.all(
        (classData || []).map(async (cls) => {
          const [studentResult, lessonResult] = await Promise.all([
            supabase
              .from("class_members")
              .select("id", { count: "exact", head: true })
              .eq("class_id", cls.id),
            supabase
              .from("lessons")
              .select("id", { count: "exact", head: true })
              .eq("class_id", cls.id),
          ]);

          return {
            ...cls,
            student_count: studentResult.count || 0,
            lesson_count: lessonResult.count || 0,
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({ title: "Fel", description: "Kunde inte hämta klasser", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) {
        toast({ title: "Fel", description: "Du tillhör ingen organisation", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase
        .from("classes")
        .insert({
          name: newClassName,
          teacher_id: user.id,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;

      setClasses([
        { ...data, student_count: 0, lesson_count: 0 },
        ...classes,
      ]);
      setNewClassName("");
      setIsCreateOpen(false);
      toast({ title: "Klass skapad", description: newClassName });
    } catch (error) {
      console.error("Error creating class:", error);
      toast({ title: "Fel", description: "Kunde inte skapa klassen", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const totalStudents = classes.reduce((a, c) => a + c.student_count, 0);
  const totalLessons = classes.reduce((a, c) => a + c.lesson_count, 0);

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
              <h1 className="font-semibold">Mina klasser</h1>
              <p className="text-xs text-muted-foreground">{organizationName || "Lärare"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6 pb-24">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={classes.length.toString()} label="Klasser" />
          <StatCard value={totalStudents.toString()} label="Elever" />
          <StatCard value={totalLessons.toString()} label="Lektioner" />
        </div>

        {/* Classes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Klasser</h2>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Ny klass
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skapa klass</DialogTitle>
                  <DialogDescription>
                    Lägg till en ny klass
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Klassnamn</Label>
                    <Input
                      placeholder="T.ex. Matematik 9A"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateClass} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skapa"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {classes.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Inga klasser ännu</p>
                <p className="text-sm">Klicka på "Ny klass" för att skapa din första</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <Card key={cls.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => navigate(`/teacher/class/${cls.id}`)}
                      >
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{cls.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cls.student_count} elever · {cls.lesson_count} lektioner
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog open={isQROpen && selectedClass?.id === cls.id} onOpenChange={(open) => {
                          setIsQROpen(open);
                          if (open) setSelectedClass(cls);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <QrCodeIcon className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>QR-kod för {cls.name}</DialogTitle>
                              <DialogDescription>
                                Elever skannar denna kod för att gå med
                              </DialogDescription>
                            </DialogHeader>
                            <QRCodeDisplay joinCode={cls.join_code} />
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="default" 
                          size="icon"
                          className="bg-accent hover:bg-accent/90"
                          onClick={() => navigate(`/teacher/record/${cls.id}`)}
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
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

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-3 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

const QRCodeDisplay = ({ joinCode }: { joinCode: string }) => {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join?code=${joinCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-6 flex flex-col items-center gap-4">
      <div className="p-4 bg-white rounded-2xl">
        <QRCodeSVG 
          value={joinUrl} 
          size={180}
          level="M"
          includeMargin={false}
        />
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Klasskod</p>
        <p className="font-mono text-2xl font-bold tracking-wider">{joinCode}</p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCopy}
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Kopierad!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Kopiera länk
          </>
        )}
      </Button>
    </div>
  );
};

export default TeacherDashboard;
