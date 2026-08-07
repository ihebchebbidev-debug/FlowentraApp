/**
 * PreviewFrame — renders React children inside a styled iframe so editor CSS
 * cannot leak into the preview.
 *
 * How it works:
 *   1. Mount an <iframe> with `srcdoc` seeding a blank HTML document.
 *   2. On iframe load, clone the parent app's <link rel="stylesheet"> and
 *      <style> tags into the iframe head so Tailwind + component CSS still
 *      apply to the site blocks (which use Tailwind classes internally).
 *   3. Portal the given children into the iframe's <body>.
 *   4. Expose the iframe's contentDocument via `onDocument` so callers can
 *      use `useSiteHead` to inject SEO tags into the same head.
 *
 * This gives us a truly isolated render surface with pixel-parity to the
 * published site.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PreviewFrameProps {
  children: React.ReactNode;
  /** Optional class on the iframe element itself. */
  className?: string;
  /** Optional inline style on the iframe element. */
  style?: React.CSSProperties;
  /** Called once the iframe document is ready. Useful for head injection. */
  onDocument?: (doc: Document) => void;
  /** Body background color inside the iframe. */
  backgroundColor?: string;
  /** Title used by AT and dev tools. */
  title?: string;
}

const SRC_DOC = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; }
      body { min-height: 100vh; }
    </style>
  </head>
  <body></body>
</html>`;

/** Copy every stylesheet <link> and <style> from the parent doc to the iframe. */
function mirrorStyles(parentDoc: Document, iframeDoc: Document) {
  const nodes = parentDoc.head.querySelectorAll('link[rel="stylesheet"], style');
  nodes.forEach((node) => {
    // Skip nodes marked as ours (SEO head, google fonts) — those are re-injected per iframe.
    if (node.getAttribute('data-wb-head') === '1') return;
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-wb-mirrored', '1');
    iframeDoc.head.appendChild(clone);
  });
}

export function PreviewFrame({
  children,
  className,
  style,
  onDocument,
  backgroundColor,
  title = 'Site preview',
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Mirror styles from parent so Tailwind / component CSS resolve inside.
      // Guard against double-mirroring after HMR.
      if (!doc.head.querySelector('[data-wb-mirrored="1"]')) {
        mirrorStyles(document, doc);
      }

      if (backgroundColor) {
        doc.body.style.backgroundColor = backgroundColor;
      }
      setMountNode(doc.body);
      onDocument?.(doc);
    };

    // iframe with srcdoc fires 'load' async; hook up first, then set srcdoc.
    iframe.addEventListener('load', handleLoad);
    // If already ready (fast paths / cached), trigger manually.
    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
    }

    return () => iframe.removeEventListener('load', handleLoad);
    // We only want this to run once per mount — subsequent style/bg changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-update body background when prop changes.
  useEffect(() => {
    if (mountNode && backgroundColor) {
      mountNode.style.backgroundColor = backgroundColor;
    }
  }, [backgroundColor, mountNode]);

  return (
    <>
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={SRC_DOC}
        className={className}
        style={{ border: 0, width: '100%', height: '100%', display: 'block', ...style }}
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </>
  );
}
