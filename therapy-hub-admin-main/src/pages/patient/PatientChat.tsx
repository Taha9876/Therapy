import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const PatientChat = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const qc = useQueryClient();

  const { data: patient } = useQuery({
    queryKey: ["my-patient", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients_with_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get doctor's user_id for chat
  const { data: doctor } = useQuery({
    queryKey: ["patient-doctor", patient?.assigned_doctor_id],
    queryFn: async () => {
      const { data } = await supabase.from("doctors_with_profiles").select("*").eq("id", patient!.assigned_doctor_id!).maybeSingle();
      return data;
    },
    enabled: !!patient?.assigned_doctor_id,
  });

  const doctorUserId = doctor?.user_id;
  const doctorName = doctor?.full_name;

  const { data: messages = [] } = useQuery({
    queryKey: ["patient-chat", user?.id, doctorUserId],
    queryFn: async () => {
      if (!doctorUserId || !user) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${doctorUserId}),and(sender_id.eq.${doctorUserId},receiver_id.eq.${user.id})`)
        .order("created_at");
      return data || [];
    },
    enabled: !!doctorUserId && !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!user || !doctorUserId) return;
      await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: doctorUserId,
        message,
      });
    },
    onSuccess: () => { setMessage(""); qc.invalidateQueries({ queryKey: ["patient-chat"] }); },
  });

  if (!patient?.assigned_doctor_id) {
    return (
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Chat with Doctor</h1>
        </div>
        <p className="text-muted-foreground">No doctor assigned yet. Please contact admin for assignment.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Chat with {doctorName || "Doctor"}</h1>
      </div>
      <div className="rounded-xl border bg-card flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground mt-8">No messages yet. Start the conversation!</p>
          ) : messages.map((m: any) => (
            <div key={m.id} className={cn("max-w-[70%] rounded-lg p-3 text-sm", m.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
              {m.message}
            </div>
          ))}
        </div>
        <div className="border-t p-3 flex gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && message && sendMutation.mutate()} />
          <Button onClick={() => message && sendMutation.mutate()} disabled={!message}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PatientChat;
