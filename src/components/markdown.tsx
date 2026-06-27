"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renderiza a resposta do chat formatada. Ao copiar o texto renderizado,
// o conteúdo vem limpo (sem os símbolos de markdown).
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (props) => <p className="mb-2 last:mb-0" {...props} />,
          ul: (props) => (
            <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />
          ),
          ol: (props) => (
            <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
          ),
          li: (props) => <li className="pl-0.5" {...props} />,
          strong: (props) => <strong className="font-semibold" {...props} />,
          em: (props) => <em className="italic" {...props} />,
          a: (props) => (
            <a
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          h1: (props) => <h3 className="mb-1 mt-2 font-semibold" {...props} />,
          h2: (props) => <h3 className="mb-1 mt-2 font-semibold" {...props} />,
          h3: (props) => <h3 className="mb-1 mt-2 font-semibold" {...props} />,
          blockquote: (props) => (
            <blockquote
              className="my-2 border-l-2 border-border pl-3 text-muted"
              {...props}
            />
          ),
          code: (props) => (
            <code
              className="rounded bg-accent px-1 py-0.5 text-[0.85em]"
              {...props}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
