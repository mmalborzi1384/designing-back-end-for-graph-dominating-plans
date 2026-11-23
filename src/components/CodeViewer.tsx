import React, { useState } from 'react';
import { Check, Copy, FileCode2, Terminal } from 'lucide-react';
import { CodeFile } from '../data/roadmapData';

interface CodeViewerProps {
  files: CodeFile[];
}

const PY_KEYWORDS = new Set([
  'from',
  'import',
  'class',
  'def',
  'async',
  'return',
  'if',
  'else',
  'elif',
  'try',
  'except',
  'raise',
  'with',
  'as',
  'in',
  'or',
  'and',
  'not',
  'is',
  'None',
  'True',
  'False',
  'for',
]);

const JS_KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'async',
  'await',
  'function',
  'return',
  'if',
  'else',
  'throw',
  'new',
  'true',
  'false',
]);

function highlightLine(line: string, language: CodeFile['language']): React.ReactNode {
  if (!line) return '\u00A0';

  if (language === 'bash') {
    if (line.trim().startsWith('#')) {
      return <span className="text-zinc-500">{line}</span>;
    }
    const parts = line.split(/^(\s*\S+)/);
    return (
      <>
        <span className="text-teal-400">{parts[1]}</span>
        <span className="text-zinc-200">{parts.slice(2).join('')}</span>
      </>
    );
  }

  if (language === 'env') {
    const eqIndex = line.indexOf('=');
    if (eqIndex > 0) {
      return (
        <>
          <span className="text-teal-300">{line.slice(0, eqIndex)}</span>
          <span className="text-zinc-500">=</span>
          <span className="text-amber-300">{line.slice(eqIndex + 1)}</span>
        </>
      );
    }
    return <span className="text-zinc-300">{line}</span>;
  }

  if (language === 'yaml') {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('#')) {
      return <span className="text-zinc-500 italic">{line}</span>;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !trimmed.startsWith('- "') && !trimmed.startsWith('- ./')) {
      const before = line.slice(0, colonIdx);
      const after = line.slice(colonIdx + 1);
      return (
        <>
          <span className="text-teal-300">{before}</span>
          <span className="text-zinc-500">:</span>
          <span className="text-amber-200">{after}</span>
        </>
      );
    }
    return <span className="text-zinc-200">{line}</span>;
  }

  if (language === 'html') {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('<!--')) {
      return <span className="text-zinc-500 italic">{line}</span>;
    }
    const tokens = line.split(/(<\/?[a-zA-Z0-9-]+|\/?>|"(?:[^"\\]|\\.)*")/g);
    return tokens.map((tok, i) => {
      if (!tok) return null;
      if (tok.startsWith('<') || tok === '>' || tok === '/>') {
        return (
          <span key={i} className="text-teal-400">
            {tok}
          </span>
        );
      }
      if (tok.startsWith('"')) {
        return (
          <span key={i} className="text-amber-200">
            {tok}
          </span>
        );
      }
      return (
        <span key={i} className="text-zinc-200">
          {tok}
        </span>
      );
    });
  }

  if (language === 'json') {
    const tokens = line.split(/("(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|\b\d+\b)/g);
    return tokens.map((tok, i) => {
      if (!tok) return null;
      if (tok.startsWith('"')) {
        const rest = tokens[i + 1] ?? '';
        const isKey = rest.trimStart().startsWith(':');
        return (
          <span key={i} className={isKey ? 'text-teal-300' : 'text-amber-200'}>
            {tok}
          </span>
        );
      }
      if (/^(true|false|null)$/.test(tok)) {
        return (
          <span key={i} className="text-emerald-300">
            {tok}
          </span>
        );
      }
      return (
        <span key={i} className="text-zinc-400">
          {tok}
        </span>
      );
    });
  }

  if (language === 'python' || language === 'javascript') {
    const trimmed = line.trimStart();
    if (
      (language === 'python' && trimmed.startsWith('#')) ||
      (language === 'javascript' && trimmed.startsWith('//'))
    ) {
      return <span className="text-zinc-500 italic">{line}</span>;
    }
    if (language === 'python' && trimmed.startsWith('@')) {
      return <span className="text-amber-300">{line}</span>;
    }

    const keywords = language === 'python' ? PY_KEYWORDS : JS_KEYWORDS;
    const tokens = line.split(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b[A-Za-z_][A-Za-z0-9_]*\b)/g
    );
    return tokens.map((tok, i) => {
      if (!tok) return null;
      if (
        (tok.startsWith('"') && tok.endsWith('"')) ||
        (tok.startsWith("'") && tok.endsWith("'")) ||
        (tok.startsWith('`') && tok.endsWith('`'))
      ) {
        return (
          <span key={i} className="text-amber-200">
            {tok}
          </span>
        );
      }
      if (keywords.has(tok)) {
        return (
          <span key={i} className="text-teal-400 font-medium">
            {tok}
          </span>
        );
      }
      return (
        <span key={i} className="text-zinc-200">
          {tok}
        </span>
      );
    });
  }

  return <span className="text-zinc-200">{line}</span>;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeFile = files[activeIndex] ?? files[0];
  if (!activeFile) return null;

  const lines = activeFile.code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopiedId(activeFile.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = activeFile.code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(activeFile.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 rounded-lg border border-zinc-800 bg-[#0D0D10] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-2 border-b border-zinc-800/90 bg-[#141418] min-w-0">
        <div
          className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 pb-0.5 sm:pb-0"
          dir="ltr"
        >
          {files.map((file, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11.5px] sm:text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                {file.language === 'bash' ? (
                  <Terminal className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                ) : (
                  <FileCode2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                )}
                <span>{file.filename}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-[11.5px] sm:text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copiedId === activeFile.id ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-teal-300">کپی شد</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>کپی</span>
            </>
          )}
        </button>
      </div>

      {activeFile.note && (
        <div className="px-3 sm:px-4 py-2 text-xs leading-6 text-zinc-400 border-b border-zinc-800/80 bg-[#111115] [overflow-wrap:anywhere]">
          {activeFile.note}
        </div>
      )}

      <div
        className="w-full max-w-full overflow-x-auto p-3 sm:p-4 text-[12px] sm:text-[13px] leading-6 font-mono [-webkit-overflow-scrolling:touch]"
        dir="ltr"
      >
        <pre className="m-0 min-w-max">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="table-row hover:bg-zinc-900/70">
                <span className="table-cell select-none pr-3 sm:pr-4 text-right text-zinc-600 tabular-nums w-7 sm:w-8">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">
                  {highlightLine(line, activeFile.language)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
