import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, Code2, TrendingUp, BrainCircuit, BarChart3,
  Bug, Shield, Eye, GitCompare, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { ScoreRing } from "@/components/ScoreRing";
import { ContributionGraph } from "@/components/ContributionGraph";
import { MetricBar } from "@/components/MetricBar";
import { useAuth } from "@/contexts/AuthContext";
import { getSubmissions, type CodeSubmission } from "@/lib/submissions";
import { useNavigate } from "react-router-dom";

const QUICK_ACTIONS = [
  { icon: Bug, text: "Bug Detection", color: "text-destructive" },
  { icon: Shield, text: "Security Scan", color: "text-[hsl(var(--warning))]" },
  { icon: Zap, text: "Optimization", color: "text-primary" },
  { icon: Eye, text: "Readability", color: "text-[hsl(var(--info))]" },
  { icon: GitCompare, text: "Refactoring", color: "text-accent" },
  { icon: Sparkles, text: "AI Mentor", color: "text-accent" },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getSubmissions(user.id).then((data) => {
        setSubmissions(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const latest = submissions[submissions.length - 1];
  const avgQuality = submissions.length
    ? Math.round(submissions.reduce((a, s) => a + s.quality_score, 0) / submissions.length)
    : 0;
  const improvement =
    submissions.length >= 2
      ? submissions[submissions.length - 1].quality_score - submissions[0].quality_score
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center glow-primary"
          >
            <BrainCircuit className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">
            Welcome{user ? `, ${user.user_metadata?.display_name || user.email?.split("@")[0]}` : ""}!
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Your AI-powered code quality dashboard. Analyze code, track progress, and level up your skills.
          </p>
        </motion.section>

        {/* Start Analyzing CTA */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            className="gap-2 px-10 text-sm"
            onClick={() => navigate("/analyze")}
          >
            <Code2 className="w-4 h-4" />
            Analyze New Code
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.text}
                onClick={() => navigate("/analyze")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all group"
              >
                <action.icon className={`w-5 h-5 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  {action.text}
                </span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Progress Summary */}
        {user && !loading && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {submissions.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-border bg-card">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No submissions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze your first code to start tracking progress!
                </p>
                <Button variant="outline" onClick={() => navigate("/analyze")}>
                  Start Analyzing
                </Button>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Your Progress
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 gap-1 text-primary"
                      onClick={() => navigate("/progress")}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      View Full Progress
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-card text-center">
                      <p className="text-2xl font-bold font-mono text-primary">{submissions.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Submissions</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card text-center">
                      <p className="text-2xl font-bold font-mono text-foreground">{avgQuality}</p>
                      <p className="text-xs text-muted-foreground mt-1">Avg Quality</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card text-center">
                      <p className={`text-2xl font-bold font-mono ${improvement >= 0 ? "text-primary" : "text-destructive"}`}>
                        {improvement >= 0 ? "+" : ""}{improvement}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Improvement</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card text-center">
                      <p className="text-2xl font-bold font-mono text-foreground">
                        {latest?.interview_readiness || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Interview Ready</p>
                    </div>
                  </div>
                </div>

                {/* Latest Scores */}
                {latest && (
                  <div className="p-6 rounded-xl border border-border bg-card">
                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
                      Latest Analysis
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <ScoreRing score={latest.quality_score} label="Quality" size={100} />
                      <ScoreRing score={latest.interview_readiness} label="Interview" size={100} color="hsl(270, 70%, 60%)" />
                      <ScoreRing score={latest.readability} label="Readability" size={100} color="hsl(217, 91%, 60%)" />
                      <ScoreRing score={latest.maintainability} label="Maintainability" size={100} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <MetricBar label="Complexity" value={latest.complexity} />
                      <MetricBar label="Security Risk" value={latest.security_risk} variant="danger" />
                    </div>
                  </div>
                )}

                {/* Contribution Graph */}
                <ContributionGraph submissions={submissions} />

                {/* Recent Submissions */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Recent Submissions</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-primary"
                      onClick={() => navigate("/progress")}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {[...submissions].reverse().slice(0, 5).map((s, i) => (
                      <div key={s.id} className="p-3 flex items-center gap-4 text-xs hover:bg-muted/30 transition-colors">
                        <span className="font-mono text-muted-foreground w-6">#{submissions.length - i}</span>
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.language}</span>
                        <div className="flex-1 flex gap-4">
                          <span>Quality: <strong className="text-primary">{s.quality_score}</strong></span>
                          <span className="text-muted-foreground">
                            Bugs: {s.bugs_count} | Security: {s.security_issues_count}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.section>
        )}

        {/* Not signed in */}
        {!user && !loading && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center py-8 rounded-xl border border-border bg-card"
          >
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Track Your Progress</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Sign in to save your analysis history, track improvement over time, and get personalized tips.
            </p>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Sign In to Get Started
            </Button>
          </motion.section>
        )}
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>CodeGuru — AI-Powered Code Quality Assistant for Students</p>
      </footer>
    </div>
  );
};

export default Home;
