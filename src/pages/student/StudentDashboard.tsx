import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  LogOut, 
  Plus,
  GraduationCap,
  BookOpen,
  ChevronRight,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Demo data
const demoClasses = [
  { 
    id: "1", 
    name: "Matematik 9A", 
    teacher: "Anna Lindqvist",
    lessons: 12,
    lastLesson: "2024-01-15"
  },
  { 
    id: "2", 
    name: "Fysik 8B", 
    teacher: "Erik Johansson",
    lessons: 8,
    lastLesson: "2024-01-14"
  },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState(demoClasses);
  const [classCode, setClassCode] = useState("");
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const handleJoinClass = () => {
    if (!classCode.trim()) return;
    
    setClasses([
      ...classes,
      { 
        id: Date.now().toString(), 
        name: `Ny klass (${classCode})`, 
        teacher: "Lärare",
        lessons: 0,
        lastLesson: "-"
      }
    ]);
    setClassCode("");
    setIsJoinOpen(false);
    toast({ title: "Du har gått med i klassen!" });
  };

  const formatDate = (dateStr: string) => {
    if (dateStr === "-") return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE", { 
      day: "numeric", 
      month: "short" 
    });
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
              <h1 className="font-semibold">Mina lektioner</h1>
              <p className="text-xs text-muted-foreground">Välkommen tillbaka!</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6 pb-24">
        {/* Join Class */}
        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Card className="border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
              <CardContent className="p-4 flex items-center justify-center gap-2 text-primary">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Gå med i en klass</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gå med i klass</DialogTitle>
              <DialogDescription>
                Skanna QR-kod eller ange klasskod
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Ange klasskod"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg"
                  maxLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleJoinClass} className="w-full">
                Gå med
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Classes */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Dina klasser</h2>
          
          <div className="space-y-2">
            {classes.map((cls) => (
              <Card 
                key={cls.id} 
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/student/class/${cls.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cls.teacher}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{cls.lessons}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(cls.lastLesson)}
                        </p>
                      </div>
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

export default StudentDashboard;