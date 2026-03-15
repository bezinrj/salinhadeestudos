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
import CheckoutSuccess from "./pages/CheckoutSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
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
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/discursivas" element={<Discursivas />} />
              <Route path="/discursivas/:id" element={<QuestionDetail />} />
              <Route path="/semanal" element={<WeeklyChallenge />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/cronometro" element={<StudyTimerPage />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/meu-plano" element={<MyPlan />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
