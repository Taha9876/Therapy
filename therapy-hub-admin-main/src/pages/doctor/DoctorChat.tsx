import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const DoctorChat = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["doctor-chat-patients", doctor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*, profiles:user_id(full_name)").eq("assigned_doctor_id", doctor!.id);
      return data || [];
    },
    enabled: !!doctor,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["doctor-chat-messages", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId || !user) return [];
      const patient = patients.find((p: any) => p.id === selectedPatientId);
      if (!patient) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${patient.user_id}),and(sender_id.eq.${patient.user_id},receiver_id.eq.${user.id})`)
        .order("created_at");
      return data || [];
    },
    enabled: !!selectedPatientId && !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const patient = patients.find((p: any) => p.id === selectedPatientId);
      if (!patient || !user) return;
      await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: patient.user_id,
        message,
      });
    },
    onSuccess: () => { setMessage(""); qc.invalidateQueries({ queryKey: ["doctor-chat-messages"] }); },
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Chat with Patients</h1>
      </div>
      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        <div className="col-span-1 rounded-xl border bg-card p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Patients</p>
          {patients.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedPatientId(p.id)}
              className={cn("w-full text-left rounded-lg px-3 py-2 text-sm transition-colors", selectedPatientId === p.id ? "bg-accent text-accent-foreground" : "hover:bg-muted")}
            >
              {(p.profiles as any)?.full_name || "Patient"}
            </button>
          ))}
          {patients.length === 0 && <p className="text-xs text-muted-foreground">No patients assigned</p>}
        </div>
        <div className="col-span-3 rounded-xl border bg-card flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!selectedPatientId ? (
              <p className="text-center text-muted-foreground mt-8">Select a patient to chat</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground mt-8">No messages yet</p>
            ) : messages.map((m: any) => (
              <div key={m.id} className={cn("max-w-[70%] rounded-lg p-3 text-sm", m.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                {m.message}
              </div>
            ))}
          </div>
          {selectedPatientId && (
            <div className="border-t p-3 flex gap-2">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && message && sendMutation.mutate()} />
              <Button onClick={() => message && sendMutation.mutate()} disabled={!message}><Send className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default DoctorChat;
