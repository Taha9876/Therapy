import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Calendar, Brain } from "lucide-react";

const PatientDashboard = () => {
  const { user } = useAuth();

  const { data: patient } = useQuery({
    queryKey: ["my-patient", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ["my-assessments", patient?.id],
    queryFn: async () => {
      const { data } = await supabase.from("assessments").select("*").eq("patient_id", patient!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!patient,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["my-appointments", patient?.id],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("*").eq("patient_id", patient!.id);
      return data || [];
    },
    enabled: !!patient,
  });

  const latest = assessments[0];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Patient Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your mental health overview</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Assessments Taken" value={assessments.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard title="Appointments" value={appointments.length} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Goal" value={patient?.goal || "Not set"} icon={<Brain className="h-5 w-5" />} />
      </div>
      {latest && (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Latest Assessment</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground">Stress</p>
              <p className="text-2xl font-bold">{latest.stress_score}</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground">Anxiety</p>
              <p className="text-2xl font-bold">{latest.anxiety_score}</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground">Depression</p>
              <p className="text-2xl font-bold">{latest.depression_score}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Risk:</span>
            <RiskBadge level={latest.risk_level as "Low" | "Medium" | "High"} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PatientDashboard;
