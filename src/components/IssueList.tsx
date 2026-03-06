import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Lightbulb, Code2 } from "lucide-react";
import { useState } from "react";
import type { Issue } from "@/lib/analysis";

interface IssueListProps {
  title: string;
  icon: React.ReactNode;
  issues: Issue[];
}

export const IssueList = ({ title, icon, issues }: IssueListProps) => {
  if (!issues.length) return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">0</span>
      </div>
      <p className="text-xs text-muted-foreground">No issues detected ✅</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto text-xs font-mono bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">{issues.length}</span>
      </div>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <IssueItem key={i} issue={issue} index={i} />
        ))}
      </div>
    </div>
  );
};

const severityIcon = (s: Issue['severity']) => {
  if (s === 'error') return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
  if (s === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--warning))]" />;
  return <Info className="w-3.5 h-3.5 text-[hsl(var(--info))]" />;
};

const IssueItem = ({ issue, index }: { issue: Issue; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg bg-muted/50 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex gap-2 text-xs p-2.5 w-full text-left hover:bg-muted/80 transition-colors"
      >
        {severityIcon(issue.severity)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">L{issue.line}</span>
            <span className="text-foreground font-medium">{issue.message}</span>
          </div>
          <p className="text-muted-foreground mt-0.5">💡 {issue.suggestion}</p>
        </div>
        {(issue.fixCode || issue.tip) && (
          expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (issue.fixCode || issue.tip) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border/50 px-3 py-2.5 space-y-2"
        >
          {issue.fixCode && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold uppercase tracking-wider mb-1.5">
                <Code2 className="w-3 h-3" /> How to fix
              </div>
              <pre className="text-[11px] bg-background/80 rounded-md p-2.5 overflow-x-auto font-mono text-foreground leading-relaxed whitespace-pre-wrap">{issue.fixCode}</pre>
            </div>
          )}
          {issue.tip && (
            <div className="flex gap-2 text-[11px] p-2 rounded-md bg-primary/5 border border-primary/10">
              <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">{issue.tip}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
