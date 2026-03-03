import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCheck, UserX } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const Doctors = () => {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: doctors = [] } = useQuery({
    queryKey: ["admin-doctors-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctors")
        .select("*, profiles:user_id(full_name)");
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const next = status === "Active" ? "Inactive" : "Active";
      await supabase.from("doctors").update({ status: next }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-doctors-list"] }); toast({ title: "Doctor status updated" }); },
  });

  const filtered = doctors.filter((d: any) => {
    const name = (d.profiles as any)?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Management</h1>
          <p className="text-sm text-muted-foreground">{doctors.length} registered doctors</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No doctors found</TableCell></TableRow>
            ) : filtered.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{(d.profiles as any)?.full_name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.specialization || "—"}</TableCell>
                <TableCell className="text-sm">{d.phone || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.availability || "—"}</TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: d.id, status: d.status })}>
                    {d.status === "Active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4 text-success" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default Doctors;
