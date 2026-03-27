import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, MessageSquare, Clock } from "lucide-react";

const DoctorDashboard = () => {
  const { user } = useAuth();

  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["doctor-appointments", doctor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("appointments_with_names").select("*").eq("doctor_id", doctor!.id);
      return data || [];
    },
    enabled: !!doctor,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["doctor-patients", doctor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients_with_profiles").select("*").eq("assigned_doctor_id", doctor!.id);
      return data || [];
    },
    enabled: !!doctor,
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Patients" value={patients.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Appointments" value={appointments.length} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Pending" value={appointments.filter((a: any) => a.status === "Pending").length} icon={<Clock className="h-5 w-5" />} variant="warning" />
        <StatCard title="Status" value={doctor?.status || "—"} icon={<MessageSquare className="h-5 w-5" />} />
      </div>
    </AdminLayout>
  );
};

export default DoctorDashboard;
