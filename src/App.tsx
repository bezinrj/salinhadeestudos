import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Discursivas from "./pages/Discursivas";
import QuestionDetail from "./pages/QuestionDetail";
import WeeklyChallenge from "./pages/WeeklyChallenge";
import Ranking from "./pages/Ranking";
import StudyTimerPage from "./pages/StudyTimerPage";
import Profile from "./pages/Profile";
import MyPlan from "./pages/MyPlan";
import Admin from "./pages/Admin";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Schedules from "./pages/Schedules";
import ScheduleDetail from "./pages/ScheduleDetail";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/discursivas" element={<Discursivas />} />
              <Route path="/discursivas/:id" element={<QuestionDetail />} />
              <Route path="/semanal" element={<WeeklyChallenge />} />
              <Route path="/semanal/:id" element={<QuestionDetail />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/cronometro" element={<StudyTimerPage />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/perfil/:userId" element={<Profile />} />
              <Route path="/meu-plano" element={<MyPlan />} />
              <Route path="/cronograma" element={<Schedules />} />
              <Route path="/cronograma/:id" element={<ScheduleDetail />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
