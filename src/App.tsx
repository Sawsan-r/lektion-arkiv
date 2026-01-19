import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TeacherInvite from "./pages/TeacherInvite";
import JoinClass from "./pages/JoinClass";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ClassLessons from "./pages/teacher/ClassLessons";
import RecordLesson from "./pages/teacher/RecordLesson";
import StudentDashboard from "./pages/student/StudentDashboard";
import ClassView from "./pages/student/ClassView";
import LessonView from "./pages/student/LessonView";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DashboardLayout from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />

              {/* Public onboarding routes */}
              <Route path="/invite" element={<TeacherInvite />} />
              <Route path="/join" element={<JoinClass />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Protected Dashboard Routes */}
              <Route element={<DashboardLayout />}>
                {/* Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="system_admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Teacher routes */}
                <Route path="/teacher" element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/class/:classId" element={
                  <ProtectedRoute requiredRole="teacher">
                    <ClassLessons />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/record/:classId" element={
                  <ProtectedRoute requiredRole="teacher">
                    <RecordLesson />
                  </ProtectedRoute>
                } />

                {/* Student routes */}
                <Route path="/student" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/class/:classId" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ClassView />
                  </ProtectedRoute>
                } />
                <Route path="/student/lesson/:lessonId" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <LessonView />
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
