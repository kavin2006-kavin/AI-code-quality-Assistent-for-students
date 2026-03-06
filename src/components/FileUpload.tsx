import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileUploadProps {
  onFileContent: (content: string, filename: string) => void;
}

const ALLOWED_EXTENSIONS = [
  ".py", ".java", ".cpp", ".c", ".js", ".ts", ".jsx", ".tsx",
  ".go", ".rs", ".php", ".rb", ".cs", ".swift", ".kt", ".kts",
];

export const FileUpload = ({ onFileContent }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }

    if (file.size > 100_000) {
      toast.error("File too large. Maximum 100KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        onFileContent(content, file.name);
        toast.success(`Loaded ${file.name}`);
      }
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(file);

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleFile}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-8 gap-1.5"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-3.5 h-3.5" />
        Upload File
      </Button>
    </>
  );
};
