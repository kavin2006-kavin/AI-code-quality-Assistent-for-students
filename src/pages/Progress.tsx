import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getSubmissions, type CodeSubmission } from "@/lib/submissions";
import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { ContributionGraph } from "@/components/ContributionGraph";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

const Progress = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getSubmissions(user.id).then(data => {
        setSubmissions(data);
        setLoading(false);
      });
    }
  }, [user]);

  const chartData = submissions.map((s, i) => ({
    name: `#${i + 1}`,
    quality: s.quality_score,
    readability: s.readability,
    interview: s.interview_readiness,
    date: new Date(s.created_at).toLocaleDateString(),
  }));

  const latest = submissions[submissions.length - 1];
  const avgQuality = submissions.length
    ? Math.round(submissions.reduce((a, s) => a + s.quality_score, 0) / submissions.length)
    : 0;
  const improvement = submissions.length >= 2
    ? submissions[submissions.length - 1].quality_score - submissions[0].quality_score
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Progress" />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-muted-foreground">Loading your progress...</div>
          </div>
        ) : submissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No submissions yet</h2>
            <p className="text-sm text-muted-foreground mb-4">Analyze your first code to start tracking progress!</p>
            <Button onClick={() => navigate("/")}>Start Analyzing</Button>
          </motion.div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-2xl font-bold font-mono text-primary">{submissions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Submissions</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-2xl font-bold font-mono text-foreground">{avgQuality}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Quality Score</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className={`text-2xl font-bold font-mono ${improvement >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {improvement >= 0 ? '+' : ''}{improvement}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Score Improvement</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-2xl font-bold font-mono text-foreground">
                  {latest?.interview_readiness || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Interview Ready</p>
              </div>
            </div>

            {/* Latest Scores */}
            {latest && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-xl border border-border bg-card">
                <ScoreRing score={latest.quality_score} label="Latest Quality" size={100} />
                <ScoreRing score={latest.interview_readiness} label="Interview" size={100} color="hsl(270, 70%, 60%)" />
                <ScoreRing score={latest.readability} label="Readability" size={100} color="hsl(217, 91%, 60%)" />
                <ScoreRing score={latest.maintainability} label="Maintainability" size={100} />
              </div>
            )}

            {/* Contribution Graph */}
            <ContributionGraph submissions={submissions} />

            {/* Progress Chart */}
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                Score Progress Over Time
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInterview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(270, 70%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(270, 70%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="hsl(215, 20%, 55%)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(230, 25%, 10%)",
                        border: "1px solid hsl(230, 20%, 18%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="quality" stroke="hsl(160, 84%, 39%)" fill="url(#colorQuality)" strokeWidth={2} name="Quality" />
                    <Area type="monotone" dataKey="interview" stroke="hsl(270, 70%, 60%)" fill="url(#colorInterview)" strokeWidth={2} name="Interview" />
                    <Line type="monotone" dataKey="readability" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} name="Readability" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Submission History */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Submission History
                </h3>
              </div>
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {[...submissions].reverse().map((s, i) => (
                  <div key={s.id} className="p-3 flex items-center gap-4 text-xs hover:bg-muted/30 transition-colors">
                    <span className="font-mono text-muted-foreground w-6">#{submissions.length - i}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.language}</span>
                    <div className="flex-1 flex gap-4">
                      <span>Quality: <strong className="text-primary">{s.quality_score}</strong></span>
                      <span>Interview: <strong>{s.interview_readiness}</strong></span>
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
      </main>
    </div>
  );
};

export default Progress;
