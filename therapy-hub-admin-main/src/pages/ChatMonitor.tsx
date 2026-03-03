import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatMonitor = () => {
  const [search, setSearch] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-chat-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*, sender:sender_id(full_name), receiver:receiver_id(full_name)")
        .order("created_at", { ascending: true });
      // The join goes to profiles via user_id — but the FK is on auth.users.
      // We'll just show IDs if profiles join fails; let's query profiles separately.
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  const getName = (userId: string) => {
    const p = profiles.find((pr: any) => pr.user_id === userId);
    return p?.full_name || "Unknown";
  };

  const filtered = messages.filter((m: any) => {
    if (showFlaggedOnly && !m.flagged) return false;
    if (search) {
      const s = search.toLowerCase();
      return m.message?.toLowerCase().includes(s) || getName(m.sender_id).toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat Monitor</h1>
          <p className="text-sm text-muted-foreground">Monitor patient-doctor conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              showFlaggedOnly ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <AlertTriangle className="h-4 w-4" /> Flagged Only
          </button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search chats..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      <div className="space-y-3 animate-fade-in">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No chat messages found.</p>
        ) : filtered.map((msg: any) => (
          <div
            key={msg.id}
            className={cn("rounded-xl border bg-card p-4 shadow-sm", msg.flagged && "ring-1 ring-destructive/30")}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{getName(msg.sender_id)}</span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="text-sm text-muted-foreground">{getName(msg.receiver_id)}</span>
              </div>
              <div className="flex items-center gap-2">
                {msg.flagged && (
                  <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" /> Flagged
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-sm">{msg.message}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default ChatMonitor;
