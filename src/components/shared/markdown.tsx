import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders AI markdown output with tasteful, theme-aware styles (no plugin). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-sm leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...p }) => <h1 className="mt-4 mb-2 text-xl font-semibold first:mt-0" {...p} />,
          h2: ({ ...p }) => <h2 className="mt-4 mb-2 text-lg font-semibold first:mt-0" {...p} />,
          h3: ({ ...p }) => <h3 className="mt-3 mb-1.5 text-base font-semibold" {...p} />,
          p: ({ ...p }) => <p className="mb-3 last:mb-0" {...p} />,
          ul: ({ ...p }) => <ul className="mb-3 ml-5 list-disc space-y-1" {...p} />,
          ol: ({ ...p }) => <ol className="mb-3 ml-5 list-decimal space-y-1" {...p} />,
          li: ({ ...p }) => <li className="pl-1" {...p} />,
          strong: ({ ...p }) => <strong className="font-semibold text-foreground" {...p} />,
          em: ({ ...p }) => <em className="italic" {...p} />,
          code: ({ ...p }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]" {...p} />
          ),
          blockquote: ({ ...p }) => (
            <blockquote className="my-3 border-l-2 border-primary/40 pl-3 text-muted-foreground" {...p} />
          ),
          table: ({ ...p }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm" {...p} />
            </div>
          ),
          th: ({ ...p }) => <th className="border-b bg-muted/50 px-3 py-1.5 font-medium" {...p} />,
          td: ({ ...p }) => <td className="border-b px-3 py-1.5 align-top" {...p} />,
          a: ({ ...p }) => <a className="text-primary underline underline-offset-2" {...p} />,
          hr: ({ ...p }) => <hr className="my-4" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
