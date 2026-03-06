import { motion } from "framer-motion";

interface MetricBarProps {
  label: string;
  value: number;
  max?: number;
  variant?: 'default' | 'danger';
}

export const MetricBar = ({ label, value, max = 100, variant = 'default' }: MetricBarProps) => {
  const pct = Math.min(100, (value / max) * 100);

  const getBarColor = () => {
    if (variant === 'danger') {
      if (pct >= 60) return "bg-destructive";
      if (pct >= 30) return "bg-[hsl(var(--warning))]";
      return "bg-[hsl(var(--success))]";
    }
    if (pct >= 70) return "bg-[hsl(var(--success))]";
    if (pct >= 40) return "bg-[hsl(var(--warning))]";
    return "bg-destructive";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getBarColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  );
};
