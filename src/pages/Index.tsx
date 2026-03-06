import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, Shield, Eye, BrainCircuit, ArrowRight, Bug,
  Sparkles, GitCompare, Upload, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/CodeEditor";
import { FileUpload } from "@/components/FileUpload";
import { AppHeader } from "@/components/AppHeader";
import { detectLanguage, SAMPLE_CODE } from "@/lib/analysis";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "csharp", label: "C#" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

const STORAGE_KEY_CODE = "codeguru_saved_code";
const STORAGE_KEY_LANG = "codeguru_saved_lang";

const FEATURES = [
  { icon: Bug, text: "Bug Detection", path: "/analyzing" },
  { icon: Shield, text: "Security Scan", path: "/analyzing" },
  { icon: Zap, text: "Optimization", path: "/analyzing" },
  { icon: Eye, text: "Readability", path: "/analyzing" },
  { icon: GitCompare, text: "Refactoring", path: "/analyzing" },
  { icon: Sparkles, text: "AI Mentor", path: "/analyzing" },
];

const Index = () => {
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CODE);
    return saved !== null ? saved : SAMPLE_CODE;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_LANG) || "python";
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CODE, code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, language);
  }, [language]);

  const handleCodeChange = useCallback((val: string) => {
    setCode(val);
    const detected = detectLanguage(val);
    setLanguage(detected);
  }, []);

  const handleClearCode = () => {
    setCode("");
    localStorage.removeItem(STORAGE_KEY_CODE);
    localStorage.removeItem(STORAGE_KEY_LANG);
    setLanguage("python");
    toast.success("Code cleared!");
  };

  const handleAnalyze = () => {
    if (!code.trim()) return;
    navigate("/analyzing", { state: { code, language } });
  };

  const handleFeatureClick = (feature: typeof FEATURES[0]) => {
    if (!code.trim()) {
      toast.error("Please paste or upload some code first!");
      return;
    }
    navigate(feature.path, { state: { code, language } });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center glow-primary"
          >
            <BrainCircuit className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Analyze Your Code with <span className="text-primary">AI</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Get instant quality scores, bug detection, security analysis, and personalized improvement tips — all explained in student-friendly language.
          </p>
          {!user && (
            <p className="text-xs text-muted-foreground mt-3">
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline">Sign in</button> to save your analysis history and track progress over time.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-muted-foreground">
            {FEATURES.map((feature) => (
              <button
                key={feature.text}
                onClick={() => handleFeatureClick(feature)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
              >
                <feature.icon className="w-3.5 h-3.5 text-primary" />
                {feature.text}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Code Input Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">Step 1: Paste Your Code</h3>
              <div className="flex gap-1 flex-wrap">
                {LANGUAGES.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setLanguage(l.value)}
                    className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                      language === l.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileUpload onFileContent={(content, filename) => {
                setCode(content);
                const ext = filename.split('.').pop()?.toLowerCase();
                const langMap: Record<string, string> = {
                  py: 'python', java: 'java', cpp: 'cpp', c: 'cpp', js: 'javascript',
                  ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
                  go: 'go', rs: 'rust', php: 'php', rb: 'ruby',
                  cs: 'csharp', swift: 'swift', kt: 'kotlin', kts: 'kotlin',
                };
                if (ext && langMap[ext]) setLanguage(langMap[ext]);
              }} />
              {code.trim() && (
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 text-destructive hover:text-destructive" onClick={handleClearCode}>
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <CodeEditor value={code} onChange={handleCodeChange} language={language} />
          
          {/* Analyze Button - prominent CTA */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleAnalyze}
              disabled={!code.trim()}
              size="lg"
              className="gap-2 px-8 text-sm"
            >
              <Zap className="w-4 h-4" />
              Analyze Code
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>CodeGuru — AI-Powered Code Quality Assistant for Students</p>
      </footer>
    </div>
  );
};

export default Index;
