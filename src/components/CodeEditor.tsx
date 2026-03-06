import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { rust } from "@codemirror/lang-rust";
import { php } from "@codemirror/lang-php";
import { javascript } from "@codemirror/lang-javascript";
import { useMemo } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string;
}

export const CodeEditor = ({ value, onChange, language, readOnly = false, height = "400px" }: CodeEditorProps) => {
  const extensions = useMemo(() => {
    switch (language) {
      case 'python': return [python()];
      case 'java': return [java()];
      case 'cpp': case 'c': return [cpp()];
      case 'go': return [go()];
      case 'rust': return [rust()];
      case 'php': return [php()];
      case 'javascript': case 'typescript': return [javascript({ typescript: language === 'typescript' })];
      case 'ruby': case 'swift': case 'kotlin': case 'csharp': return [java()]; // closest fallback
      default: return [python()];
    }
  }, [language]);

  return (
    <div className="rounded-xl overflow-hidden border border-border glow-primary">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={vscodeDark}
        extensions={extensions}
        height={height}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          autocompletion: false,
        }}
      />
    </div>
  );
};
