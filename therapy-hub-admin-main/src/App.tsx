import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Assessments from "./pages/Assessments";
import ChatMonitor from "./pages/ChatMonitor";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorChat from "./pages/doctor/DoctorChat";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAssessment from "./pages/patient/PatientAssessment";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientChat from "./pages/patient/PatientChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    {/* Admin routes */}
    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><Dashboard /></ProtectedRoute>} />
    <Route path="/patients" element={<ProtectedRoute allowedRoles={["admin"]}><Patients /></ProtectedRoute>} />
    <Route path="/doctors" element={<ProtectedRoute allowedRoles={["admin"]}><Doctors /></ProtectedRoute>} />
    <Route path="/assessments" element={<ProtectedRoute allowedRoles={["admin"]}><Assessments /></ProtectedRoute>} />
    <Route path="/chat-monitor" element={<ProtectedRoute allowedRoles={["admin"]}><ChatMonitor /></ProtectedRoute>} />
    {/* Doctor routes */}
    <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
    <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorPatients /></ProtectedRoute>} />
    <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorAppointments /></ProtectedRoute>} />
    <Route path="/doctor/chat" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorChat /></ProtectedRoute>} />
    {/* Patient routes */}
    <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
    <Route path="/patient/assessment" element={<ProtectedRoute allowedRoles={["patient"]}><PatientAssessment /></ProtectedRoute>} />
    <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={["patient"]}><PatientAppointments /></ProtectedRoute>} />
    <Route path="/patient/chat" element={<ProtectedRoute allowedRoles={["patient"]}><PatientChat /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
