import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Bug, Shield, Zap, Eye, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { analyzeCode, type AnalysisResult } from "@/lib/analysis";
import { saveSubmission } from "@/lib/submissions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STEPS = [
  { icon: Bug, label: "Detecting bugs...", color: "text-[hsl(var(--warning))]" },
  { icon: Shield, label: "Scanning security...", color: "text-destructive" },
  { icon: Zap, label: "Finding optimizations...", color: "text-[hsl(var(--info))]" },
  { icon: Eye, label: "Checking readability...", color: "text-accent" },
  { icon: Sparkles, label: "Generating insights...", color: "text-primary" },
];

const Analyzing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const { code, language } = (location.state as { code: string; language: string }) || {};

  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }

    // Animate steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 800);

    // Run analysis
    const runAnalysis = async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ code, language }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Analysis failed" }));
          throw new Error(err.error || `Error ${resp.status}`);
        }

        const result: AnalysisResult = await resp.json();
        
        if (user) {
          const saved = await saveSubmission(user.id, code, language, result);
          if (saved) toast.success("Analysis saved to your history!");
        }

        toast.success("Analysis complete!");
        navigate("/results", { state: { code, language, result }, replace: true });
      } catch (e: any) {
        console.error("Analysis error:", e);
        toast.error(e.message || "Analysis failed. Using local fallback.");
        const result = analyzeCode(code, language);
        navigate("/results", { state: { code, language, result }, replace: true });
      }
    };

    runAnalysis();
    return () => clearInterval(stepInterval);
  }, [code, language, navigate, user]);

  if (!code) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Analyzing" />
      <main className="max-w-2xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 glow-primary"
          >
            <BrainCircuit className="w-10 h-10 text-primary" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Analyzing Your Code</h2>
          <p className="text-sm text-muted-foreground mb-10">
            Our AI is reviewing your {language} code for bugs, security issues, and improvements
          </p>

          <div className="w-full max-w-sm space-y-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isDone || isActive ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isActive ? "border-primary/50 bg-primary/5" : isDone ? "border-border bg-card" : "border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDone ? "bg-primary/20" : isActive ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {isActive ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Icon className={`w-4 h-4 ${step.color}`} />
                      </motion.div>
                    ) : (
                      <Icon className={`w-4 h-4 ${isDone ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? "font-medium text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                    {isDone ? step.label.replace("...", " ✓") : step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Analyzing;
