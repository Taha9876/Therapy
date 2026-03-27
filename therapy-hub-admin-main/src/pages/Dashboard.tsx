import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Stethoscope, ClipboardList, AlertTriangle, Calendar, MessageSquare,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const Dashboard = () => {
  const { data: patients = [] } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients_with_profiles").select("*");
      return data || [];
    },
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors_with_profiles").select("*");
      return data || [];
    },
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ["admin-assessments"],
    queryFn: async () => {
      const { data } = await supabase.from("assessments").select("*");
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments_with_names")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: flaggedChats = [] } = useQuery({
    queryKey: ["admin-flagged-chats"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("flagged", true);
      return data || [];
    },
  });

  const highRisk = assessments.filter((a: any) => a.risk_level === "High");
  const pendingAppts = appointments.filter((a: any) => a.status === "Pending");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">System overview and real-time statistics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Patients" value={patients.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Total Doctors" value={doctors.length} icon={<Stethoscope className="h-5 w-5" />} />
        <StatCard title="Assessments" value={assessments.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard title="High Risk" value={highRisk.length} icon={<AlertTriangle className="h-5 w-5" />} variant="danger" />
        <StatCard title="Pending Appts" value={pendingAppts.length} icon={<Calendar className="h-5 w-5" />} variant="warning" />
        <StatCard title="Flagged Chats" value={flaggedChats.length} icon={<MessageSquare className="h-5 w-5" />} variant="danger" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            High-Risk Assessments
          </h2>
          {highRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">No high-risk assessments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highRisk.slice(0, 5).map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell><RiskBadge level={a.risk_level} /></TableCell>
                    <TableCell>{a.total_score}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Appointments
          </h2>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.slice(0, 5).map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.patient_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.doctor_name || "—"}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
