/**
 * RichTextInput — A compact rich-text editor for the website builder properties panel.
 * Supports bold, italic, underline, text color, and an HTML source-code toggle.
 * Outputs HTML strings and calls `onChange` in real-time on every edit.
 */
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Bold, Italic, Underline, Paintbrush, Code, Undo2, Redo2, Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextInputProps {
  value: string;
  onChange: (html: string) => void;
  /** Placeholder when the editor is empty */
  placeholder?: string;
  /** Minimum editor height in px */
  minHeight?: number;
  /** Extra className for the wrapper */
  className?: string;
}

const QUICK_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#000000', '#ffffff', '#6b7280',
];

export function RichTextInput({
  value,
  onChange,
  placeholder = 'Type here…',
  minHeight = 60,
  className,
}: RichTextInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [showColor, setShowColor] = useState(false);
  // Track whether we set innerHTML from prop to avoid cursor jumping
  const internalUpdate = useRef(false);

  // Sync prop → editor only when NOT being edited (initial mount / external changes)
  useEffect(() => {
    if (editorRef.current && !internalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    internalUpdate.current = false;
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    internalUpdate.current = true;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
  }, [emitChange]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const handleHtmlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const toggleHtml = useCallback(() => {
    if (htmlMode && editorRef.current) {
      // Switching back from HTML → visual: sync editor
      editorRef.current.innerHTML = value || '';
    }
    setHtmlMode((prev) => !prev);
    setShowColor(false);
  }, [htmlMode, value]);

  // ── Toolbar button helper ──
  const ToolBtn = ({
    icon: Icon,
    title,
    onClick,
    active,
  }: {
    icon: React.ElementType;
    title: string;
    onClick: () => void;
    active?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-6 w-6 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60',
        active && 'bg-muted text-foreground',
      )}
      onClick={onClick}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <div className={cn('rounded-lg border border-border/40 bg-background overflow-hidden', className)}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border/30 bg-muted/20 flex-wrap">
        <ToolBtn icon={Bold} title="Bold" onClick={() => exec('bold')} />
        <ToolBtn icon={Italic} title="Italic" onClick={() => exec('italic')} />
        <ToolBtn icon={Underline} title="Underline" onClick={() => exec('underline')} />
        <ToolBtn
          icon={Type}
          title="Strikethrough"
          onClick={() => exec('strikeThrough')}
        />
        <div className="w-px h-4 bg-border/30 mx-0.5" />

        {/* Text Color */}
        <div className="relative">
          <ToolBtn
            icon={Paintbrush}
            title="Text Color"
            onClick={() => setShowColor((p) => !p)}
            active={showColor}
          />
          {showColor && (
            <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 p-1.5 bg-popover border border-border rounded-lg shadow-lg">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    exec('foreColor', c);
                    setShowColor(false);
                  }}
                  className="w-5 h-5 rounded-md border border-border/30 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="w-5 h-5 rounded-md border border-border/30 cursor-pointer overflow-hidden relative hover:scale-110 transition-transform">
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    exec('foreColor', e.target.value);
                    setShowColor(false);
                  }}
                />
                <span className="w-full h-full block bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
              </label>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border/30 mx-0.5" />
        <ToolBtn icon={Undo2} title="Undo" onClick={() => exec('undo')} />
        <ToolBtn icon={Redo2} title="Redo" onClick={() => exec('redo')} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* HTML toggle */}
        <ToolBtn
          icon={Code}
          title={htmlMode ? 'Visual mode' : 'HTML mode'}
          onClick={toggleHtml}
          active={htmlMode}
        />
      </div>

      {/* ── Editor area ── */}
      {htmlMode ? (
        <Textarea
          value={value || ''}
          onChange={handleHtmlChange}
          className="border-0 rounded-none text-xs font-mono min-h-[60px] focus-visible:ring-0 focus-visible:ring-offset-0 resize-y"
          style={{ minHeight }}
          rows={4}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={emitChange}
          data-placeholder={placeholder}
          className={cn(
            'px-3 py-2 text-xs outline-none overflow-auto',
            'prose prose-xs max-w-none',
            '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/40 [&:empty]:before:pointer-events-none',
          )}
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
