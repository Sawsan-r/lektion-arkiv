import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Play,
  Calendar,
  Clock,
  FileText
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// Demo data
const demoLessons = [
  { 
    id: "1", 
    title: "Ekvationer och uttryck",
    date: "2024-01-15",
    duration: "45 min",
    hasSummary: true
  },
  { 
    id: "2", 
    title: "Geometri: Area och omkrets",
    date: "2024-01-12",
    duration: "50 min",
    hasSummary: true
  },
  { 
    id: "3", 
    title: "Statistik och sannolikhet",
    date: "2024-01-10",
    duration: "40 min",
    hasSummary: true
  },
  { 
    id: "4", 
    title: "Introduktion till algebra",
    date: "2024-01-08",
    duration: "45 min",
    hasSummary: false
  },
];

const ClassView = () => {
  const navigate = useNavigate();
  const { classId } = useParams();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE", { 
      weekday: "short",
      day: "numeric", 
      month: "short" 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Matematik 9A</h1>
            <p className="text-xs text-muted-foreground">Anna Lindqvist</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4 pb-24">
        <h2 className="font-semibold text-lg">Lektioner</h2>
        
        <div className="space-y-2">
          {demoLessons.map((lesson) => (
            <Card 
              key={lesson.id} 
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/student/lesson/${lesson.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{lesson.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(lesson.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration}
                      </span>
                    </div>
                    {lesson.hasSummary && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                        <FileText className="w-3 h-3" />
                        <span>Sammanfattning tillgänglig</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="shrink-0"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ClassView;