interface AiDocumentationProps {
  language?: 'en' | 'fr';
}

export function AiDocumentation(_props: AiDocumentationProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p className="text-sm">Documentation cleared. Content to be added.</p>
    </div>
  );
}

export default AiDocumentation;
