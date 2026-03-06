import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/lib/analysis";

export interface CodeSubmission {
  id: string;
  user_id: string;
  code: string;
  language: string;
  quality_score: number;
  readability: number;
  complexity: number;
  maintainability: number;
  security_risk: number;
  interview_readiness: number;
  bugs_count: number;
  security_issues_count: number;
  optimizations_count: number;
  code_smells_count: number;
  analysis_json: any;
  created_at: string;
}

export async function saveSubmission(
  userId: string,
  code: string,
  language: string,
  result: AnalysisResult
): Promise<CodeSubmission | null> {
  const { data, error } = await supabase
    .from("code_submissions" as any)
    .insert({
      user_id: userId,
      code,
      language,
      quality_score: result.qualityScore,
      readability: result.readability,
      complexity: result.complexity,
      maintainability: result.maintainability,
      security_risk: result.securityRisk,
      interview_readiness: result.interviewReadiness,
      bugs_count: result.bugs.length,
      security_issues_count: result.securityIssues.length,
      optimizations_count: result.optimizations.length,
      code_smells_count: result.codeSmells.length,
      analysis_json: result,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Failed to save submission:", error);
    return null;
  }
  return data as any as CodeSubmission;
}

export async function getSubmissions(userId: string): Promise<CodeSubmission[]> {
  const { data, error } = await supabase
    .from("code_submissions" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch submissions:", error);
    return [];
  }
  return (data || []) as any as CodeSubmission[];
}
