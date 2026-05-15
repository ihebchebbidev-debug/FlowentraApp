import { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, disabled, placeholder, className, minHeight = '160px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value only on first mount or when value is fundamentally different
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const ToolBtn = ({ cmd, icon: Icon, title, val }: { cmd: string; icon: any; title: string; val?: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
      disabled={disabled}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className={cn('rounded-md border border-border/50 bg-background overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-muted/20">
        <ToolBtn cmd="bold" icon={Bold} title="Bold" />
        <ToolBtn cmd="italic" icon={Italic} title="Italic" />
        <ToolBtn cmd="underline" icon={Underline} title="Underline" />
        <div className="w-px h-4 bg-border/40 mx-1" />
        <ToolBtn cmd="insertUnorderedList" icon={List} title="Bullet list" />
        <ToolBtn cmd="justifyLeft" icon={AlignLeft} title="Align left" />
        <ToolBtn cmd="justifyCenter" icon={AlignCenter} title="Center" />
        <div className="w-px h-4 bg-border/40 mx-1" />
        <select
          onChange={(e) => { exec('fontSize', e.target.value); e.target.value = ''; }}
          className="text-[11px] bg-transparent border-none outline-none text-muted-foreground cursor-pointer"
          defaultValue=""
          disabled={disabled}
        >
          <option value="" disabled>
            Size
          </option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
        </select>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        className={cn(
          'px-3 py-2.5 text-[13px] leading-relaxed text-foreground outline-none overflow-y-auto',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50'
        )}
        style={{ minHeight }}
      />
    </div>
  );
}
