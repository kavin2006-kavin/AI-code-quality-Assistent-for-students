import { useNavigate, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { MentorChat } from "@/components/MentorChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const Mentor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { code, language } = (location.state as { code: string; language: string }) || {};

  if (!code) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader subtitle="AI Mentor" />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">AI Code Mentor</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-3 h-3" />
                Back to Results
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => navigate("/")}>
                <BarChart3 className="w-3 h-3" />
                New Analysis
              </Button>
            </div>
          </div>
          <MentorChat code={code} language={language} />
        </motion.div>
      </main>
    </div>
  );
};

export default Mentor;
