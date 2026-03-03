import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";

const DoctorPatients = () => {
  const { user } = useAuth();

  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["doctor-patients", doctor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*, profiles:user_id(full_name)").eq("assigned_doctor_id", doctor!.id);
      return data || [];
    },
    enabled: !!doctor,
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Patients</h1>
        <p className="text-sm text-muted-foreground">{patients.length} assigned patients</p>
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No patients assigned yet</TableCell></TableRow>
            ) : patients.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{(p.profiles as any)?.full_name || "—"}</TableCell>
                <TableCell>{p.age || "—"}</TableCell>
                <TableCell>{p.gender || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.goal || "—"}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default DoctorPatients;
