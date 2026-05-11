"use client";

import { useRef, useCallback } from "react";

const KEYWORDS = new Set([
  "function", "var", "let", "const", "if", "else", "for", "while", "do",
  "return", "class", "new", "this", "import", "export", "from", "default",
  "switch", "case", "break", "continue", "try", "catch", "throw", "finally",
  "async", "await", "yield", "typeof", "instanceof", "in", "of", "void",
  "null", "undefined", "true", "false", "def", "print", "elif", "except",
  "lambda", "pass", "raise", "with", "as", "int", "float", "double", "bool",
  "string", "char", "public", "private", "protected", "static", "final",
  "void", "include", "using", "namespace", "struct", "enum", "interface",
  "extends", "implements", "type", "number",
]);

function highlightLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // Single-line comments
    if ((line[i] === "/" && line[i + 1] === "/") || (line[i] === "#" && (i === 0 || line[i - 1] === " "))) {
      tokens.push(<span key={i} style={{ color: "#757575" }}>{line.slice(i)}</span>);
      break;
    }

    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < len && line[j] !== quote) {
        if (line[j] === "\\") j++;
        j++;
      }
      j = Math.min(j + 1, len);
      tokens.push(<span key={i} style={{ color: "#A5D6A7" }}>{line.slice(i, j)}</span>);
      i = j;
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]{}!&|^~%]/.test(line[i - 1]))) {
      let j = i;
      while (j < len && /[\d.xXa-fA-F]/.test(line[j])) j++;
      tokens.push(<span key={i} style={{ color: "#FFB74D" }}>{line.slice(i, j)}</span>);
      i = j;
      continue;
    }

    // Words (check for keywords)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        tokens.push(<span key={i} style={{ color: "#CE93D8" }}>{word}</span>);
      } else {
        tokens.push(<span key={i}>{word}</span>);
      }
      i = j;
      continue;
    }

    tokens.push(<span key={i}>{line[i]}</span>);
    i++;
  }

  return tokens;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = value.split("\n");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newVal = value.substring(0, start) + "  " + value.substring(end);
        onChange(newVal);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const highlight = ta?.parentElement?.querySelector(".code-highlight") as HTMLElement | null;
    const lineNums = ta?.parentElement?.querySelector(".line-numbers") as HTMLElement | null;
    if (ta && highlight) highlight.scrollTop = ta.scrollTop;
    if (ta && lineNums) lineNums.scrollTop = ta.scrollTop;
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0D1117]">
      <div className="flex min-h-[300px] max-h-[500px]">
        {/* Line numbers */}
        <div
          className="line-numbers shrink-0 select-none overflow-hidden py-4 px-3 text-right border-r border-white/[0.06] bg-[#0D1117]"
          style={{ minWidth: 48 }}
        >
          {lines.map((_, i) => (
            <div key={i} className="text-[13px] leading-[1.6] text-white/20 font-mono">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Editor area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Highlighted overlay */}
          <div
            className="code-highlight absolute inset-0 py-4 px-4 overflow-auto pointer-events-none"
            aria-hidden
          >
            <pre className="font-mono text-[13px] leading-[1.6] text-white/90 whitespace-pre">
              {lines.map((line, i) => (
                <div key={i}>{line === "" ? "\n" : highlightLine(line)}</div>
              ))}
            </pre>
          </div>

          {/* Actual textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            className="relative w-full h-full min-h-[300px] max-h-[500px] resize-none py-4 px-4
              font-mono text-[13px] leading-[1.6] text-transparent caret-white
              bg-transparent outline-none whitespace-pre overflow-auto"
          />
        </div>
      </div>
    </div>
  );
}
