import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, UserX, UserCheck, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const Patients = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["admin-patients-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("patients")
        .select("*, profiles:user_id(full_name, user_id), doctors:assigned_doctor_id(profiles:user_id(full_name))");
      return data || [];
    },
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ["admin-all-assessments"],
    queryFn: async () => {
      const { data } = await supabase.from("assessments").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from("patients").update({ status: status === "Active" ? "Inactive" : "Active" }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-patients-list"] }); toast({ title: "Patient status updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from("patients").delete().eq("user_id", userId);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-patients-list"] }); toast({ title: "Patient deleted", variant: "destructive" }); },
  });

  const filtered = patients.filter((p: any) => {
    const name = (p.profiles as any)?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase()) || p.goal?.toLowerCase().includes(search.toLowerCase());
  });

  const getLatestAssessment = (patientId: string) => {
    return assessments.find((a: any) => a.patient_id === patientId);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Management</h1>
          <p className="text-sm text-muted-foreground">{patients.length} registered patients</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No patients found</TableCell></TableRow>
            ) : filtered.map((p: any) => {
              const assessment = getLatestAssessment(p.id);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{(p.profiles as any)?.full_name || "—"}</TableCell>
                  <TableCell>{p.age || "—"}</TableCell>
                  <TableCell>{p.gender || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.goal || "—"}</TableCell>
                  <TableCell>{assessment ? <RiskBadge level={assessment.risk_level as "Low" | "Medium" | "High"} /> : "—"}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelected({ ...p, assessment })}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: p.id, status: p.status })}>
                        {p.status === "Active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.user_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{(selected?.profiles as any)?.full_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Age:</span> {selected.age || "—"}</div>
                <div><span className="text-muted-foreground">Gender:</span> {selected.gender || "—"}</div>
                <div><span className="text-muted-foreground">Goal:</span> {selected.goal || "—"}</div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={selected.status} /></div>
              </div>
              {selected.assessment && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold">Latest Assessment</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-xs text-muted-foreground">Stress</p>
                      <p className="text-xl font-bold">{selected.assessment.stress_score}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-xs text-muted-foreground">Anxiety</p>
                      <p className="text-xl font-bold">{selected.assessment.anxiety_score}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-xs text-muted-foreground">Depression</p>
                      <p className="text-xl font-bold">{selected.assessment.depression_score}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <RiskBadge level={selected.assessment.risk_level} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Patients;
