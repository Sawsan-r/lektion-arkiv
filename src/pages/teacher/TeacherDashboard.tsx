import { useState } from "react";
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
  QrCode,
  BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Demo data
const demoClasses = [
  { id: "1", name: "Matematik 9A", students: 28, lessons: 12 },
  { id: "2", name: "Fysik 8B", students: 24, lessons: 8 },
  { id: "3", name: "Kemi 7C", students: 26, lessons: 5 },
];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState(demoClasses);
  const [newClassName, setNewClassName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<typeof demoClasses[0] | null>(null);
  const [isQROpen, setIsQROpen] = useState(false);

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    
    setClasses([
      ...classes,
      { 
        id: Date.now().toString(), 
        name: newClassName, 
        students: 0, 
        lessons: 0 
      }
    ]);
    setNewClassName("");
    setIsCreateOpen(false);
    toast({ title: "Klass skapad", description: newClassName });
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
              <h1 className="font-semibold">Mina klasser</h1>
              <p className="text-xs text-muted-foreground">Sundbybergs Gymnasium</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6 pb-24">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={classes.length.toString()} label="Klasser" />
          <StatCard value={classes.reduce((a, c) => a + c.students, 0).toString()} label="Elever" />
          <StatCard value={classes.reduce((a, c) => a + c.lessons, 0).toString()} label="Lektioner" />
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
                  <Button onClick={handleCreateClass}>Skapa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                          {cls.students} elever · {cls.lessons} lektioner
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
                            <QrCode className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>QR-kod för {cls.name}</DialogTitle>
                            <DialogDescription>
                              Elever skannar denna kod för att gå med
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-6 flex flex-col items-center gap-4">
                            <div className="w-48 h-48 bg-muted rounded-2xl flex items-center justify-center">
                              <QrCode className="w-32 h-32 text-foreground" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Klasskod</p>
                              <p className="font-mono text-2xl font-bold">{cls.id.slice(0, 6).toUpperCase()}</p>
                            </div>
                          </div>
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

export default TeacherDashboard;