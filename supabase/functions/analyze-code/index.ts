import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!code || !code.trim()) {
      return new Response(JSON.stringify({ error: "No code provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert code reviewer and static analysis tool. Analyze the given ${language || "Python"} code with 100% accuracy. You MUST find every real bug, error, security issue, optimization opportunity, and code smell.

IMPORTANT RULES:
- Only report REAL issues that actually exist in the code. Do NOT invent issues.
- Give the EXACT line number for each issue.
- For each issue, provide a clear message, severity, a detailed suggestion on how to fix it, a concrete code fix example, and an educational tip.
- Be thorough: check for logic errors, off-by-one errors, null/undefined issues, type errors, resource leaks, race conditions, unhandled exceptions, etc.
- For security: check for injection, hardcoded secrets, unsafe deserialization, XSS, CSRF, etc.
- For optimizations: check for algorithmic inefficiency, unnecessary loops, better stdlib usage.
- For code smells: check for naming, dead code, long functions, magic numbers, etc.

CONCEPT-LEVEL ANALYSIS (also check these high-level patterns):
- Missing error handling for I/O, network, or file operations
- Missing input validation in functions
- God functions / classes doing too many things (Single Responsibility violation)
- Missing documentation (docstrings, JSDoc)
- Tight coupling (too many dependencies)
- Resource leaks (files, connections not properly closed)
- Recursion without clear base case
- Global state mutation
- Missing type hints/annotations
- Hardcoded magic numbers without named constants
- Violation of DRY principle (duplicate logic)
- Missing edge case handling (empty input, null, boundary values)

Supported languages: Python, Java, C++, JavaScript, TypeScript, Go, Rust, PHP, Ruby, C#, Swift, Kotlin.

You MUST respond with a JSON object using this EXACT tool call format. Do not add any text outside the tool call.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this ${language} code thoroughly:\n\`\`\`${language}\n${code}\n\`\`\`` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_analysis",
              description: "Report the complete code analysis results",
              parameters: {
                type: "object",
                properties: {
                  qualityScore: { type: "number", description: "Overall quality score 0-100" },
                  readability: { type: "number", description: "Readability score 0-100" },
                  complexity: { type: "number", description: "Complexity score 0-100 (higher = more complex)" },
                  maintainability: { type: "number", description: "Maintainability score 0-100" },
                  securityRisk: { type: "number", description: "Security risk score 0-100 (higher = more risky)" },
                  interviewReadiness: { type: "number", description: "Interview readiness score 0-100" },
                  bugs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        line: { type: "number" },
                        severity: { type: "string", enum: ["error", "warning", "info"] },
                        message: { type: "string" },
                        suggestion: { type: "string", description: "How to fix this issue" },
                        fixCode: { type: "string", description: "Concrete code fix example" },
                        tip: { type: "string", description: "Educational tip for students about why this matters" },
                      },
                      required: ["line", "severity", "message", "suggestion"],
                      additionalProperties: false,
                    },
                  },
                  securityIssues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        line: { type: "number" },
                        severity: { type: "string", enum: ["error", "warning", "info"] },
                        message: { type: "string" },
                        suggestion: { type: "string" },
                        fixCode: { type: "string" },
                        tip: { type: "string" },
                      },
                      required: ["line", "severity", "message", "suggestion"],
                      additionalProperties: false,
                    },
                  },
                  optimizations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        line: { type: "number" },
                        severity: { type: "string", enum: ["error", "warning", "info"] },
                        message: { type: "string" },
                        suggestion: { type: "string" },
                        fixCode: { type: "string" },
                        tip: { type: "string" },
                      },
                      required: ["line", "severity", "message", "suggestion"],
                      additionalProperties: false,
                    },
                  },
                  codeSmells: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        line: { type: "number" },
                        severity: { type: "string", enum: ["error", "warning", "info"] },
                        message: { type: "string" },
                        suggestion: { type: "string" },
                        fixCode: { type: "string" },
                        tip: { type: "string" },
                      },
                      required: ["line", "severity", "message", "suggestion"],
                      additionalProperties: false,
                    },
                  },
                  refactoredCode: { type: "string", description: "The improved version of the code with all fixes applied" },
                  explanation: { type: "string", description: "Student-friendly markdown explanation of the analysis" },
                  metrics: {
                    type: "object",
                    properties: {
                      linesOfCode: { type: "number" },
                      cyclomaticComplexity: { type: "number" },
                      commentRatio: { type: "number" },
                      nestingDepth: { type: "number" },
                      namingQuality: { type: "number" },
                    },
                    required: ["linesOfCode", "cyclomaticComplexity", "commentRatio", "nestingDepth", "namingQuality"],
                    additionalProperties: false,
                  },
                },
                required: ["qualityScore", "readability", "complexity", "maintainability", "securityRisk", "interviewReadiness", "bugs", "securityIssues", "optimizations", "codeSmells", "refactoredCode", "explanation", "metrics"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
