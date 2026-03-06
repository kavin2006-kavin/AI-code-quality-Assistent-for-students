// Analysis engine with concept-level error detection

export interface AnalysisResult {
  qualityScore: number;
  readability: number;
  complexity: number;
  maintainability: number;
  securityRisk: number;
  interviewReadiness: number;
  bugs: Issue[];
  securityIssues: Issue[];
  optimizations: Issue[];
  codeSmells: Issue[];
  refactoredCode: string;
  explanation: string;
  metrics: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    commentRatio: number;
    nestingDepth: number;
    namingQuality: number;
  };
}

export interface Issue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  fixCode?: string;
  tip?: string;
}

export function detectLanguage(code: string): string {
  if (/def\s+\w+\s*\(|import\s+\w+|print\s*\(/.test(code)) return 'python';
  if (/public\s+class|System\.out\.print|import\s+java/.test(code)) return 'java';
  if (/#include|cout\s*<<|std::/.test(code)) return 'cpp';
  if (/func\s+\w+\(|package\s+main|fmt\.Print/.test(code)) return 'go';
  if (/fn\s+\w+\(|let\s+mut\s|println!\(/.test(code)) return 'rust';
  if (/\<\?php|echo\s|function\s+\w+\s*\(.*\)\s*\{/.test(code) && /\$\w+/.test(code)) return 'php';
  if (/fun\s+\w+\(|val\s+\w+|println\(/.test(code) && !/System\.out/.test(code)) return 'kotlin';
  if (/func\s+\w+\(|let\s+\w+\s*[:=]|import\s+Foundation/.test(code) && !/package\s+main/.test(code)) return 'swift';
  if (/using\s+System|namespace\s+\w+|Console\.Write/.test(code)) return 'csharp';
  if (/def\s+\w+|puts\s|require\s+'/.test(code) && /end\b/.test(code)) return 'ruby';
  if (/function\s+\w+|const\s+\w+\s*=|=>/.test(code)) return 'javascript';
  return 'python';
}

export function analyzeCode(code: string, language: string): AnalysisResult {
  const lines = code.split('\n');
  const loc = lines.length;
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('#') || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*');
  }).length;
  const commentRatio = loc > 0 ? Math.round((commentLines / loc) * 100) : 0;

  let maxNesting = 0;
  for (const line of lines) {
    const indent = line.search(/\S/);
    if (indent >= 0) {
      const level = Math.floor(indent / (language === 'python' ? 4 : 2));
      maxNesting = Math.max(maxNesting, level);
    }
  }

  const bugs: Issue[] = [];
  const securityIssues: Issue[] = [];
  const optimizations: Issue[] = [];
  const codeSmells: Issue[] = [];

  // === LINE-LEVEL DETECTION ===
  lines.forEach((line, i) => {
    const ln = i + 1;
    const trimmed = line.trim();

    // Security
    if (/password\s*=\s*['"]/.test(line))
      securityIssues.push({ line: ln, severity: 'error', message: 'Hardcoded password detected', suggestion: 'Use environment variables or a secrets manager.', fixCode: `password = os.environ.get('PASSWORD')`, tip: 'Hardcoded credentials in source code can be exposed in version control, leading to unauthorized access.' });
    if (/api[_-]?key\s*=\s*['"]/.test(line.toLowerCase()))
      securityIssues.push({ line: ln, severity: 'error', message: 'Hardcoded API key detected', suggestion: 'Store API keys in environment variables.', fixCode: `api_key = os.environ.get('API_KEY')`, tip: 'API keys should never be committed to source control.' });
    if (/eval\s*\(/.test(line))
      securityIssues.push({ line: ln, severity: 'error', message: 'Use of eval() is dangerous', suggestion: 'Avoid eval(). Use safe parsing methods like JSON.parse().', fixCode: `# Use ast.literal_eval() for Python or JSON.parse() for JS`, tip: 'eval() executes arbitrary code and is a common attack vector for code injection.' });
    if (/exec\s*\(/.test(line) && language === 'python')
      securityIssues.push({ line: ln, severity: 'error', message: 'Use of exec() is dangerous', suggestion: 'Avoid exec(). Use safer alternatives.', tip: 'exec() can execute arbitrary Python code, which is a severe security risk.' });
    if (/SELECT.*\+.*['"]/.test(line) || /f["'].*SELECT/.test(line) || /format\(.*SELECT/.test(line))
      securityIssues.push({ line: ln, severity: 'error', message: 'Possible SQL injection', suggestion: 'Use parameterized queries instead of string concatenation.', fixCode: `cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))`, tip: 'SQL injection is one of the most common web vulnerabilities. Always use parameterized queries.' });
    if (/pickle\.load/.test(line))
      securityIssues.push({ line: ln, severity: 'warning', message: 'Unsafe deserialization with pickle', suggestion: 'Pickle can execute arbitrary code. Use JSON or a safer format.', tip: 'Pickle deserialization of untrusted data can lead to remote code execution.' });

    // Bugs
    if (/except\s*:/.test(line) && language === 'python')
      bugs.push({ line: ln, severity: 'warning', message: 'Bare except clause catches all exceptions', suggestion: 'Catch specific exceptions: except ValueError as e:', fixCode: `except ValueError as e:\n    logger.error(f"Value error: {e}")`, tip: 'Bare except catches SystemExit, KeyboardInterrupt too, hiding real problems.' });
    if (/==\s*None/.test(line) && language === 'python')
      bugs.push({ line: ln, severity: 'warning', message: 'Use "is None" instead of "== None"', suggestion: 'Replace == None with "is None" for identity comparison.', fixCode: `if value is None:`, tip: '"is" checks identity while "==" checks equality. None is a singleton, so use "is".' });
    if (/def\s+\w+\(.*=\s*\[\s*\]/.test(line) && language === 'python')
      bugs.push({ line: ln, severity: 'error', message: 'Mutable default argument (list)', suggestion: 'Use None as default and create list inside function.', fixCode: `def func(items=None):\n    items = items or []`, tip: 'Mutable defaults are shared across all calls, causing unexpected behavior.' });
    if (/def\s+\w+\(.*=\s*\{\s*\}/.test(line) && language === 'python')
      bugs.push({ line: ln, severity: 'error', message: 'Mutable default argument (dict)', suggestion: 'Use None as default and create dict inside function.', fixCode: `def func(data=None):\n    data = data if data is not None else {}`, tip: 'Same issue as mutable list defaults—shared across calls.' });
    if (/\/\s*len\s*\(/.test(line) && !/if\s+len/.test(lines.slice(Math.max(0, i - 2), i).join('')))
      bugs.push({ line: ln, severity: 'warning', message: 'Potential division by zero (dividing by len())', suggestion: 'Check if the list is empty before dividing.', fixCode: `if len(items) > 0:\n    avg = total / len(items)`, tip: 'Always guard against division by zero to prevent runtime crashes.' });
    if (/input\s*\(/.test(line) && language === 'python' && /int\s*\(/.test(line) && !/try/.test(lines.slice(Math.max(0, i - 3), i).join('')))
      bugs.push({ line: ln, severity: 'warning', message: 'Unchecked int() conversion of user input', suggestion: 'Wrap in try/except ValueError.', fixCode: `try:\n    value = int(input("Enter number: "))\nexcept ValueError:\n    print("Please enter a valid number")`, tip: 'User input is unpredictable—always validate before casting.' });

    // Optimizations
    if (/for\s.*in\s+range\(len\(/.test(line) && language === 'python')
      optimizations.push({ line: ln, severity: 'warning', message: 'Use enumerate() instead of range(len())', suggestion: 'Replace with enumerate() for cleaner, Pythonic code.', fixCode: `for i, item in enumerate(items):`, tip: 'enumerate() is more Pythonic and less error-prone than manual indexing.' });
    if (/\.append\(/.test(line) && /for\s/.test(lines.slice(Math.max(0, i - 3), i + 1).join('')) && language === 'python')
      optimizations.push({ line: ln, severity: 'info', message: 'Consider list comprehension', suggestion: 'Replace loop + append with a list comprehension.', fixCode: `result = [transform(item) for item in items]`, tip: 'List comprehensions are faster and more readable for simple transformations.' });
    if (/\+\s*=\s*["']/.test(line) && language === 'python' && /for\s/.test(lines.slice(Math.max(0, i - 3), i).join('')))
      optimizations.push({ line: ln, severity: 'warning', message: 'String concatenation in loop', suggestion: 'Use str.join() for better performance.', fixCode: `result = "".join(parts)`, tip: 'String concatenation in loops creates O(n²) complexity due to immutable strings.' });

    // Code smells
    if (/\bvar\b/.test(line) && language === 'javascript')
      codeSmells.push({ line: ln, severity: 'warning', message: 'Use of var keyword', suggestion: 'Use const or let instead.', fixCode: `const value = ...;  // or let if reassigned`, tip: 'var has function scope and hoisting issues. const/let have block scope.' });
    if (/print\s*\(/.test(line) && language === 'python' && !/#.*debug/i.test(line))
      codeSmells.push({ line: ln, severity: 'info', message: 'Print statement (consider logging)', suggestion: 'Use the logging module for production code.', fixCode: `import logging\nlogger = logging.getLogger(__name__)\nlogger.info("message")`, tip: 'Logging provides levels, formatting, and can be configured without code changes.' });
    if (line.length > 120)
      codeSmells.push({ line: ln, severity: 'info', message: `Line exceeds 120 characters (${line.length})`, suggestion: 'Break long lines for readability.' });
    if (/TODO|FIXME|HACK|XXX/i.test(line))
      codeSmells.push({ line: ln, severity: 'info', message: 'TODO/FIXME comment found', suggestion: 'Address this technical debt item.' });
    if (trimmed === 'pass' && language === 'python')
      codeSmells.push({ line: ln, severity: 'info', message: 'Empty block (pass statement)', suggestion: 'Implement the block or add a descriptive comment.' });
  });

  // === CONCEPT-LEVEL DETECTION ===
  
  // 1. Missing error handling pattern
  const hasTryCatch = /try\s*[:{\n]/.test(code) || /\.catch\(/.test(code);
  const hasIO = /open\(|read\(|write\(|fetch\(|request|http|socket|file/i.test(code);
  if (hasIO && !hasTryCatch) {
    bugs.push({ line: 1, severity: 'warning', message: 'I/O operations without error handling', suggestion: 'Wrap file/network operations in try-except/try-catch blocks.', fixCode: `try:\n    with open("file.txt") as f:\n        data = f.read()\nexcept FileNotFoundError:\n    print("File not found")\nexcept IOError:\n    print("Error reading file")`, tip: 'I/O operations can fail for many reasons (network, permissions, missing files). Always handle these gracefully.' });
  }

  // 2. No input validation
  const hasFunctions = /def\s+\w+\(|function\s+\w+\(|const\s+\w+\s*=\s*\(/.test(code);
  const hasParamCheck = /if\s+(not\s+)?\w+|isinstance\(|typeof\s|\.length|\.size/.test(code);
  if (hasFunctions && !hasParamCheck && loc > 10) {
    codeSmells.push({ line: 1, severity: 'warning', message: 'No input validation in functions', suggestion: 'Add parameter validation at function entry points.', fixCode: `def process(data):\n    if not data:\n        raise ValueError("data cannot be empty")\n    if not isinstance(data, list):\n        raise TypeError("data must be a list")`, tip: 'Validating inputs early prevents cryptic errors deeper in the code (fail-fast principle).' });
  }

  // 3. God function (single function does too much)
  const funcMatches = code.match(/def\s+\w+|function\s+\w+/g);
  if (funcMatches && funcMatches.length === 1 && loc > 40) {
    codeSmells.push({ line: 1, severity: 'warning', message: 'Single large function — "God function" anti-pattern', suggestion: 'Break into smaller functions with single responsibilities.', tip: 'Each function should do one thing well. This makes code easier to test, debug, and reuse (Single Responsibility Principle).' });
  }

  // 4. No docstrings/JSDoc
  const hasDocstring = /""".*"""|'''.*'''|\/\*\*[\s\S]*?\*\/|@param|@returns/.test(code);
  if (hasFunctions && !hasDocstring && loc > 15) {
    codeSmells.push({ line: 1, severity: 'info', message: 'Missing function documentation', suggestion: 'Add docstrings or JSDoc comments to functions.', fixCode: language === 'python' 
      ? `def calculate(x, y):\n    """Calculate the sum of two numbers.\n    \n    Args:\n        x: First number\n        y: Second number\n    \n    Returns:\n        Sum of x and y\n    """\n    return x + y` 
      : `/**\n * Calculate the sum of two numbers.\n * @param {number} x - First number\n * @param {number} y - Second number\n * @returns {number} Sum of x and y\n */`, 
      tip: 'Documentation helps other developers (and future you) understand intent without reading implementation.' });
  }

  // 5. Hardcoded values / no constants
  const magicNumbers = code.match(/(?:if|elif|while|return)\s.*\b\d{2,}\b/g);
  if (magicNumbers && magicNumbers.length >= 3) {
    codeSmells.push({ line: 1, severity: 'warning', message: 'Multiple magic numbers — extract as named constants', suggestion: 'Define constants at the top of the file with descriptive names.', fixCode: `# Define constants\nPASSING_GRADE = 60\nHONORS_THRESHOLD = 90\nMAX_RETRIES = 3`, tip: 'Named constants make code self-documenting and easier to update consistently.' });
  }

  // 6. No type hints (Python)
  if (language === 'python' && hasFunctions && !/def\s+\w+\(.*:/.test(code) && loc > 10) {
    codeSmells.push({ line: 1, severity: 'info', message: 'Missing type hints', suggestion: 'Add type annotations to function parameters and return values.', fixCode: `def calculate_average(scores: list[float]) -> float:\n    return sum(scores) / len(scores)`, tip: 'Type hints improve IDE support, catch bugs early, and serve as documentation.' });
  }

  // 7. Global state mutation
  const hasGlobalMutation = /^[a-zA-Z_]\w*\s*=/.test(code) && /def\s+\w+/.test(code) && language === 'python';
  const usesGlobalInFunc = /\bglobal\s+\w+/.test(code);
  if (usesGlobalInFunc) {
    bugs.push({ line: 1, severity: 'warning', message: 'Global state mutation detected', suggestion: 'Avoid using global variables. Pass data through function parameters instead.', fixCode: `# Instead of:\nglobal counter\ncounter += 1\n\n# Use:\ndef increment(counter):\n    return counter + 1`, tip: 'Global state makes code harder to test, debug, and reason about. It can cause subtle bugs in concurrent code.' });
  }

  // 8. Resource leak detection
  if (language === 'python' && /open\(/.test(code) && !/with\s+open/.test(code)) {
    bugs.push({ line: 1, severity: 'error', message: 'Potential resource leak — file opened without context manager', suggestion: 'Use "with" statement to ensure files are properly closed.', fixCode: `with open("file.txt", "r") as f:\n    data = f.read()`, tip: 'Without a context manager, files may not be closed on exceptions, causing resource leaks.' });
  }

  // 9. Recursion without base case check
  if (hasFunctions) {
    const funcNames = (code.match(/def\s+(\w+)|function\s+(\w+)/g) || []).map(m => m.split(/\s+/)[1]);
    for (const fn of funcNames) {
      if (fn && new RegExp(`${fn}\\s*\\(`).test(code)) {
        const fnCode = code.slice(code.indexOf(fn));
        const callCount = (fnCode.match(new RegExp(`${fn}\\s*\\(`, 'g')) || []).length;
        if (callCount >= 2 && !/if\s|return\s/.test(fnCode.slice(0, 200))) {
          bugs.push({ line: 1, severity: 'error', message: `Recursive function '${fn}' may lack proper base case`, suggestion: 'Ensure recursive functions have a clear base case to prevent infinite recursion.', tip: 'Every recursive function needs a base case that stops recursion. Without it, you get a stack overflow.' });
        }
      }
    }
  }

  // 10. Tight coupling detection
  const importCount = (code.match(/^import\s|^from\s.*import/gm) || []).length;
  if (importCount > 8) {
    codeSmells.push({ line: 1, severity: 'warning', message: `High number of imports (${importCount}) — possible tight coupling`, suggestion: 'Consider if all imports are necessary, or if the module has too many responsibilities.', tip: 'Many imports suggest a module is doing too much. Consider splitting it into focused modules (Separation of Concerns).' });
  }

  // Single-char variable names
  const varPattern = language === 'python'
    ? /^(\s*)(\w)\s*=/gm
    : /(?:let|const|var|int|float|double|string|char)\s+(\w)\s*[=;]/gm;
  let m;
  while ((m = varPattern.exec(code)) !== null) {
    const name = m[2] || m[1];
    if (name && name.length === 1 && !['i', 'j', 'k', 'n', 'x', 'y', '_'].includes(name)) {
      const ln = code.substring(0, m.index).split('\n').length;
      codeSmells.push({ line: ln, severity: 'info', message: `Poor variable name '${name}'`, suggestion: 'Use descriptive variable names.', tip: 'Good names reduce the need for comments and make code self-explanatory.' });
    }
  }

  // Duplicate code blocks
  const seenBlocks = new Map<string, number>();
  for (let i = 0; i < lines.length - 2; i++) {
    const block = lines.slice(i, i + 3).map(l => l.trim()).filter(l => l).join('|');
    if (block.length > 10) {
      if (seenBlocks.has(block)) {
        codeSmells.push({ line: i + 1, severity: 'warning', message: `Duplicate code block (also at line ${seenBlocks.get(block)})`, suggestion: 'Extract repeated code into a reusable function.', tip: 'DRY (Don\'t Repeat Yourself) — duplicated code means duplicated bugs and maintenance.' });
      } else {
        seenBlocks.set(block, i + 1);
      }
    }
  }

  // Function length check
  let funcStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(def |function |const \w+ = |class )/.test(lines[i])) {
      if (funcStart >= 0 && i - funcStart > 30) {
        codeSmells.push({ line: funcStart + 1, severity: 'warning', message: `Long function (${i - funcStart} lines)`, suggestion: 'Break into smaller helper functions.', tip: 'Functions over 20-30 lines are harder to understand and test.' });
      }
      funcStart = i;
    }
  }

  // Unused imports
  if (language === 'python') {
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (/^import\s+(\w+)/.test(trimmed)) {
        const mod = trimmed.match(/^import\s+(\w+)/)?.[1];
        if (mod && !code.includes(mod + '.') && code.split(mod).length <= 2)
          codeSmells.push({ line: i + 1, severity: 'info', message: `Potentially unused import: ${mod}`, suggestion: 'Remove unused imports.' });
      }
    });
  }

  const totalIssues = bugs.length + securityIssues.length + optimizations.length + codeSmells.length;
  const namingQuality = Math.max(30, 100 - codeSmells.filter(s => s.message.includes('variable name')).length * 15);

  const qualityScore = Math.max(10, Math.min(100, Math.round(100 - totalIssues * 5 - maxNesting * 3 + commentRatio * 0.5)));
  const readability = Math.max(15, Math.min(100, Math.round(100 - maxNesting * 8 - codeSmells.length * 4 + commentRatio * 0.8)));
  const complexity = Math.min(100, maxNesting * 15 + loc * 0.3 + bugs.length * 10);
  const maintainability = Math.max(20, Math.min(100, Math.round(100 - complexity * 0.4 + commentRatio * 0.3 - totalIssues * 3)));
  const securityRisk = Math.min(100, securityIssues.length * 25);
  const interviewReadiness = Math.max(10, Math.min(100, Math.round(qualityScore * 0.3 + readability * 0.2 + maintainability * 0.2 + (100 - securityRisk) * 0.15 + namingQuality * 0.15)));

  let refactoredCode = code;
  if (language === 'python') {
    refactoredCode = refactoredCode.replace(/for\s+(\w+)\s+in\s+range\(len\((\w+)\)\)/g, 'for $1, val in enumerate($2)');
    refactoredCode = refactoredCode.replace(/except\s*:/g, 'except Exception as e:');
  }

  const explanation = generateExplanation(qualityScore, bugs, securityIssues, optimizations, codeSmells, language);

  return {
    qualityScore, readability, complexity: Math.round(complexity), maintainability, securityRisk, interviewReadiness,
    bugs, securityIssues, optimizations, codeSmells, refactoredCode, explanation,
    metrics: { linesOfCode: loc, cyclomaticComplexity: Math.round(complexity / 10), commentRatio, nestingDepth: maxNesting, namingQuality },
  };
}

function generateExplanation(score: number, bugs: Issue[], security: Issue[], opts: Issue[], smells: Issue[], lang: string): string {
  const parts: string[] = [];
  parts.push(`Your ${lang} code scored **${score}/100** overall.`);
  
  if (score >= 80) parts.push("Great job! Your code is well-structured and clean. 🎉");
  else if (score >= 60) parts.push("Good effort! There's room for improvement though. 💪");
  else parts.push("Your code needs significant improvements. Let's work on it! 📝");

  if (bugs.length) parts.push(`\n**🐛 Bugs Found (${bugs.length}):** ${bugs[0].message}. ${bugs[0].suggestion}`);
  if (security.length) parts.push(`\n**🔒 Security Issues (${security.length}):** ${security[0].message}. ${security[0].suggestion}`);
  if (opts.length) parts.push(`\n**⚡ Optimizations (${opts.length}):** ${opts[0].message}. ${opts[0].suggestion}`);
  if (smells.length) parts.push(`\n**👃 Code Smells (${smells.length}):** ${smells[0].message}. ${smells[0].suggestion}`);
  if (!bugs.length && !security.length && !opts.length && !smells.length) parts.push("\nNo major issues detected — nice work!");

  return parts.join('\n');
}

export const SAMPLE_CODE = `# Student Grade Calculator
password = "admin123"

def calculate_grades(students):
    results = []
    for i in range(len(students)):
        s = students[i]
        total = 0
        for j in range(len(s["scores"])):
            total = total + s["scores"][j]
        avg = total / len(s["scores"])
        if avg >= 90:
            grade = "A"
        elif avg >= 80:
            grade = "B"  
        elif avg >= 70:
            grade = "C"
        elif avg >= 60:
            grade = "D"
        else:
            grade = "F"
        results.append({"name": s["name"], "average": avg, "grade": grade})
    return results

try:
    data = [{"name": "Alice", "scores": [85, 92, 78]}, {"name": "Bob", "scores": [90, 88, 95]}]
    result = calculate_grades(data)
    print(result)
except:
    print("Error occurred")
`;
