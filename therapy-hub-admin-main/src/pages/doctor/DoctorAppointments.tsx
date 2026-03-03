import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DoctorAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

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
      const { data } = await supabase
        .from("appointments")
        .select("*, patients:patient_id(profiles:user_id(full_name))")
        .eq("doctor_id", doctor!.id)
        .order("appointment_date", { ascending: false });
      return data || [];
    },
    enabled: !!doctor,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from("appointments").update({ status }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["doctor-appointments"] }); toast({ title: "Appointment updated" }); },
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No appointments</TableCell></TableRow>
            ) : appointments.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{(a.patients as any)?.profiles?.full_name || "—"}</TableCell>
                <TableCell>{new Date(a.appointment_date).toLocaleDateString()}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-right">
                  {a.status === "Pending" && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: a.id, status: "Confirmed" })}>
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: a.id, status: "Cancelled" })}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                  {a.status === "Confirmed" && (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: a.id, status: "Completed" })}>Complete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default DoctorAppointments;
