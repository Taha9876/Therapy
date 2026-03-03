import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PatientAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");

  const { data: patient } = useQuery({
    queryKey: ["my-patient", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", patient?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, doctor:doctor_id(profiles:user_id(full_name))")
        .eq("patient_id", patient!.id)
        .order("appointment_date", { ascending: false });
      return data || [];
    },
    enabled: !!patient,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["available-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("*, profiles:user_id(full_name)").eq("status", "Active");
      return data || [];
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!patient) return;
      await supabase.from("appointments").insert({
        patient_id: patient.id,
        doctor_id: doctorId,
        appointment_date: new Date(date).toISOString(),
      });
    },
    onSuccess: () => {
      toast({ title: "Appointment booked!" });
      setOpen(false);
      setDoctorId("");
      setDate("");
      qc.invalidateQueries({ queryKey: ["patient-appointments"] });
    },
  });

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Book Appointment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Book Appointment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{(d.profiles as any)?.full_name} — {d.specialization}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button onClick={() => bookMutation.mutate()} disabled={!doctorId || !date} className="w-full">Book</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No appointments yet</TableCell></TableRow>
            ) : appointments.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{(a.doctor as any)?.profiles?.full_name || "—"}</TableCell>
                <TableCell>{new Date(a.appointment_date).toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default PatientAppointments;
