import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Bug, Shield, Zap, Eye, GitCompare, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/ScoreRing";
import { MetricBar } from "@/components/MetricBar";
import { IssueList } from "@/components/IssueList";
import { CodeEditor } from "@/components/CodeEditor";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate, useLocation } from "react-router-dom";
import type { AnalysisResult } from "@/lib/analysis";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { code, language, result } = (location.state as {
    code: string;
    language: string;
    result: AnalysisResult;
  }) || {};
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!result) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Results" />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold">Analysis Results</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate("/")}>
                Analyze Another
              </Button>
              <Button size="sm" className="text-xs h-8 gap-1.5" onClick={() => navigate("/mentor", { state: { code, language } })}>
                <Sparkles className="w-3.5 h-3.5" />
                Ask AI Mentor
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 h-9">
              <TabsTrigger value="dashboard" className="text-xs gap-1.5 data-[state=active]:bg-card">
                <BarChart3 className="w-3.5 h-3.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="issues" className="text-xs gap-1.5 data-[state=active]:bg-card">
                <Bug className="w-3.5 h-3.5" /> Issues
              </TabsTrigger>
              <TabsTrigger value="refactor" className="text-xs gap-1.5 data-[state=active]:bg-card">
                <GitCompare className="w-3.5 h-3.5" /> Refactor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-xl border border-border bg-card">
                <ScoreRing score={result.qualityScore} label="Quality" />
                <ScoreRing score={result.interviewReadiness} label="Interview Ready" color="hsl(270, 70%, 60%)" />
                <ScoreRing score={result.readability} label="Readability" color="hsl(217, 91%, 60%)" />
                <ScoreRing score={result.maintainability} label="Maintainability" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Code Health
                  </h3>
                  <MetricBar label="Readability" value={result.readability} />
                  <MetricBar label="Maintainability" value={result.maintainability} />
                  <MetricBar label="Naming Quality" value={result.metrics.namingQuality} />
                  <MetricBar label="Comment Coverage" value={result.metrics.commentRatio} />
                </div>
                <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-destructive" /> Risk Assessment
                  </h3>
                  <MetricBar label="Complexity" value={result.complexity} variant="danger" />
                  <MetricBar label="Security Risk" value={result.securityRisk} variant="danger" />
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    {[
                      { val: result.metrics.linesOfCode, lbl: "Lines" },
                      { val: result.metrics.cyclomaticComplexity, lbl: "Complexity" },
                      { val: result.metrics.nestingDepth, lbl: "Max Depth" },
                      { val: `${result.metrics.commentRatio}%`, lbl: "Comments" },
                    ].map(({ val, lbl }) => (
                      <div key={lbl} className="p-2 rounded-lg bg-muted/50 text-center">
                        <p className="font-mono text-lg font-bold text-foreground">{val}</p>
                        <p className="text-muted-foreground">{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" /> AI Explanation
                </h3>
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {result.explanation.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4 mt-4">
              <IssueList title="Security Issues" icon={<Shield className="w-4 h-4 text-destructive" />} issues={result.securityIssues} />
              <IssueList title="Bugs" icon={<Bug className="w-4 h-4 text-[hsl(var(--warning))]" />} issues={result.bugs} />
              <IssueList title="Optimizations" icon={<Zap className="w-4 h-4 text-[hsl(var(--info))]" />} issues={result.optimizations} />
              <IssueList title="Code Smells" icon={<Eye className="w-4 h-4 text-accent" />} issues={result.codeSmells} />
            </TabsContent>

            <TabsContent value="refactor" className="space-y-4 mt-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Original Code</h4>
                  <CodeEditor value={code} onChange={() => {}} language={language} readOnly height="350px" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-primary mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Improved Code
                  </h4>
                  <CodeEditor value={result.refactoredCode} onChange={() => {}} language={language} readOnly height="350px" />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="text-xs font-semibold mb-2">AI Explanation:</h4>
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {result.explanation.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>CodeGuru — AI-Powered Code Quality Assistant for Students</p>
      </footer>
    </div>
  );
};

export default Results;
