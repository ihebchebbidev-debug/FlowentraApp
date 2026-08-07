import React, { useCallback, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

type Props = {
  files: File[];
  setFiles: (f: File[]) => void;
  maxFiles?: number;
};

export default function FileUploader({ files, setFiles, maxFiles = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (!dropped.length) return;
    const next = files.concat(dropped).slice(0, maxFiles);
    setFiles(next);
  }, [files, setFiles, maxFiles]);

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    const next = files.concat(picked).slice(0, maxFiles);
    setFiles(next);
  };

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
  };

  return (
    <div>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        className="border-dashed border-2 border-border rounded-md p-4 flex flex-col md:flex-row items-center gap-4 bg-muted/20"
      >
        <div className="flex-1 text-sm text-muted-foreground">Drag & drop files here, or <button type="button" onClick={() => inputRef.current?.click()} className="text-primary underline">browse</button>. Max {maxFiles} files.</div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onSelectFiles} />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>Select</Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {files.map((file, idx) => (
            <Card key={idx} className="p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-12 h-8 object-cover rounded" />
                ) : (
                  <div className="w-12 h-8 flex items-center justify-center bg-muted rounded text-xs">{file.name.split('.').pop() || 'file'}</div>
                )}
                <div className="text-sm truncate max-w-[140px]">{file.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => removeFile(idx)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
