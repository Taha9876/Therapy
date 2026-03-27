import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import RiskBadge from "@/components/RiskBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PatientAssessment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ["my-patient", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["mcq-questions"],
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

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!patient) return;
      const stress = questions.filter((q: any) => q.category === "Stress").reduce((sum: number, q: any) => sum + (answers[q.id] || 0), 0);
      const anxiety = questions.filter((q: any) => q.category === "Anxiety").reduce((sum: number, q: any) => sum + (answers[q.id] || 0), 0);
      const depression = questions.filter((q: any) => q.category === "Depression").reduce((sum: number, q: any) => sum + (answers[q.id] || 0), 0);
      const total = stress + anxiety + depression;
      const lowMax = scoringConfig?.low_max || 5;
      const medMax = scoringConfig?.medium_max || 10;
      const risk = total <= lowMax ? "Low" : total <= medMax ? "Medium" : "High";

      await supabase.from("assessments").insert({
        patient_id: patient.id,
        stress_score: stress,
        anxiety_score: anxiety,
        depression_score: depression,
        total_score: total,
        risk_level: risk,
      });
    },
    onSuccess: () => {
      toast({ title: "Assessment submitted!" });
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
    },
  });

  if (questions.length === 0) {
    return (
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Take Assessment</h1>
        </div>
        <p className="text-muted-foreground">No assessment questions available yet. Please check back later.</p>
      </AdminLayout>
    );
  }

  if (submitted) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-2">Assessment Complete!</h1>
          <p className="text-muted-foreground mb-6">Your results have been recorded.</p>
          <Button onClick={() => { setSubmitted(false); setAnswers({}); }}>Take Another</Button>
        </div>
      </AdminLayout>
    );
  }

  const allAnswered = questions.every((q: any) => answers[q.id] !== undefined);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Take Assessment</h1>
        <p className="text-sm text-muted-foreground">Answer all {questions.length} questions honestly</p>
      </div>
      <div className="space-y-4 max-w-2xl">
        {questions.map((q: any, idx: number) => (
          <div key={q.id} className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
            <p className="text-sm font-medium mb-3">
              <span className="text-muted-foreground mr-2">{idx + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-2">
              {(q.options as any[])?.map((opt: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                  className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    answers[q.id] === opt.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={() => submitMutation.mutate()} disabled={!allAnswered || submitMutation.isPending} className="w-full">
          {submitMutation.isPending ? "Submitting..." : "Submit Assessment"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default PatientAssessment;
