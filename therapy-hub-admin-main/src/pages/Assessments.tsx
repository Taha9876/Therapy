import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  Stress: "bg-warning/15 text-warning border-warning/30",
  Anxiety: "bg-secondary/15 text-secondary border-secondary/30",
  Depression: "bg-destructive/15 text-destructive border-destructive/30",
};

type MCQCategory = "Stress" | "Anxiety" | "Depression";

const Assessments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    question: "",
    category: "Stress" as MCQCategory,
    options: [
      { text: "Not at all", value: 0 },
      { text: "Several days", value: 1 },
      { text: "More than half the days", value: 2 },
      { text: "Nearly every day", value: 3 },
    ],
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["admin-mcqs"],
    queryFn: async () => {
      const { data } = await supabase.from("mcq_questions").select("*").order("created_at");
      return data || [];
    },
  });

  const { data: scoringConfig } = useQuery({
    queryKey: ["scoring-config"],
    queryFn: async () => {
      const { data } = await supabase.from("scoring_config").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const [ranges, setRanges] = useState({ low_max: 5, medium_min: 6, medium_max: 10, high_min: 11 });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        await supabase.from("mcq_questions").update({
          question: form.question,
          category: form.category,
          options: form.options as any,
        }).eq("id", editId);
      } else {
        await supabase.from("mcq_questions").insert({
          question: form.question,
          category: form.category,
          options: form.options as any,
          created_by: user?.id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mcqs"] });
      toast({ title: editId ? "Question updated" : "Question added" });
      resetForm();
      setAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("mcq_questions").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mcqs"] });
      toast({ title: "Question deleted", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      question: "",
      category: "Stress",
      options: [
        { text: "Not at all", value: 0 },
        { text: "Several days", value: 1 },
        { text: "More than half the days", value: 2 },
        { text: "Nearly every day", value: 3 },
      ],
    });
    setEditId(null);
  };

  const editQuestion = (q: any) => {
    setForm({ question: q.question, category: q.category, options: q.options || [] });
    setEditId(q.id);
    setAddOpen(true);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">MCQ & Assessment Management</h1>
          <p className="text-sm text-muted-foreground">{questions.length} questions configured</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Add Question</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add New"} Question</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter question text..." />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as MCQCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stress">Stress</SelectItem>
                    <SelectItem value="Anxiety">Anxiety</SelectItem>
                    <SelectItem value="Depression">Depression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Options & Weights</Label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={opt.text} onChange={(e) => { const opts = [...form.options]; opts[i] = { ...opts[i], text: e.target.value }; setForm({ ...form, options: opts }); }} className="flex-1" />
                    <Input type="number" value={opt.value} onChange={(e) => { const opts = [...form.options]; opts[i] = { ...opts[i], value: Number(e.target.value) }; setForm({ ...form, options: opts }); }} className="w-20" />
                  </div>
                ))}
              </div>
              <Button onClick={() => saveMutation.mutate()} className="w-full gap-2" disabled={saveMutation.isPending}>
                <Save className="h-4 w-4" />{editId ? "Update" : "Save"} Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scoring Ranges */}
      <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
        <h2 className="mb-3 text-sm font-semibold text-card-foreground">Scoring Ranges</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-2">Low Risk (0 – {scoringConfig?.low_max || 5})</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-2">Medium Risk ({scoringConfig?.medium_min || 6} – {scoringConfig?.medium_max || 10})</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-2">High Risk ({scoringConfig?.high_min || 11}+)</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 animate-fade-in">
        {questions.map((q: any) => (
          <div key={q.id} className="flex items-start justify-between rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className={categoryColors[q.category] || ""}>{q.category}</Badge>
              </div>
              <p className="text-sm font-medium text-card-foreground">{q.question}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(q.options as any[])?.map((opt: any, i: number) => (
                  <span key={i} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {opt.text} ({opt.value})
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-4 flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => editQuestion(q)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <p className="text-center text-muted-foreground py-8">No questions yet. Add your first MCQ above.</p>}
      </div>
    </AdminLayout>
  );
};

export default Assessments;
