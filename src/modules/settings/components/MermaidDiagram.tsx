import { useEffect, useRef } from "react";
import mermaid from "mermaid";

let initialized = false;

export default function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
        er: { useMaxWidth: true },
      });
      initialized = true;
    }
    let cancelled = false;
    const id = `mmd-${Math.random().toString(36).slice(2, 9)}`;
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch((err) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre class="text-xs text-destructive whitespace-pre-wrap">${String(err)}</pre>`;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return <div ref={ref} className="overflow-auto" />;
}
