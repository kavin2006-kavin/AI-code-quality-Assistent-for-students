import { useMemo } from "react";
import type { CodeSubmission } from "@/lib/submissions";

interface ContributionGraphProps {
  submissions: CodeSubmission[];
}

export const ContributionGraph = ({ submissions }: ContributionGraphProps) => {
  const { weeks, months } = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Count submissions per day
    const countMap = new Map<string, number>();
    submissions.forEach(s => {
      const key = new Date(s.created_at).toISOString().split("T")[0];
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    // Build weeks grid (53 weeks x 7 days)
    const weeks: { date: Date; count: number; key: string }[][] = [];
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // align to Sunday

    let currentWeek: { date: Date; count: number; key: string }[] = [];
    const d = new Date(startDate);

    while (d <= today) {
      const key = d.toISOString().split("T")[0];
      currentWeek.push({ date: new Date(d), count: countMap.get(key) || 0, key });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Month labels
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const mid = week[Math.min(3, week.length - 1)];
      const m = mid.date.getMonth();
      if (m !== lastMonth) {
        months.push({ label: mid.date.toLocaleString("default", { month: "short" }), col: wi });
        lastMonth = m;
      }
    });

    return { weeks, months };
  }, [submissions]);

  const totalSubmissions = submissions.length;

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/50";
    if (count === 1) return "bg-primary/30";
    if (count === 2) return "bg-primary/50";
    if (count <= 4) return "bg-primary/70";
    return "bg-primary";
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">
          {totalSubmissions} submissions in the last year
        </h3>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-2 text-[10px] text-muted-foreground">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[13px] flex items-center justify-end pr-1 w-8">
                {label}
              </div>
            ))}
          </div>

          <div>
            {/* Month labels */}
            <div className="flex gap-[3px] mb-1 text-[10px] text-muted-foreground">
              {weeks.map((_, wi) => {
                const month = months.find(m => m.col === wi);
                return (
                  <div key={wi} className="w-[13px] text-center">
                    {month ? (
                      <span className="whitespace-nowrap">{month.label}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = week[di];
                    if (!day) return <div key={di} className="w-[13px] h-[13px]" />;
                    return (
                      <div
                        key={day.key}
                        className={`w-[13px] h-[13px] rounded-[2px] ${getColor(day.count)} transition-colors`}
                        title={`${day.key}: ${day.count} submission${day.count !== 1 ? "s" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="w-[13px] h-[13px] rounded-[2px] bg-muted/50" />
        <div className="w-[13px] h-[13px] rounded-[2px] bg-primary/30" />
        <div className="w-[13px] h-[13px] rounded-[2px] bg-primary/50" />
        <div className="w-[13px] h-[13px] rounded-[2px] bg-primary/70" />
        <div className="w-[13px] h-[13px] rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
};
