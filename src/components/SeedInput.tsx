import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface SeedInputProps {
  value: string;
  onChange: (value: string) => void;
}

const SeedInput = ({ value, onChange }: SeedInputProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.csv'))) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange(ev.target?.result as string);
      };
      reader.readAsText(file);
    }
  }, [onChange]);

  const lineCount = value ? value.split('\n').filter(l => l.trim()).length : 0;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/40'
        }`}
      >
        <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop a <span className="text-foreground font-medium">.txt</span> or{' '}
          <span className="text-foreground font-medium">.csv</span> file here
        </p>
        {fileName && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-xs">
            <FileText size={12} />
            <span>{fileName}</span>
            <button onClick={() => { setFileName(null); onChange(''); }} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste seed phrases here, one per line...&#10;&#10;apple banana cherry dog elephant fox grape horse ice jazz kite lemon&#10;mango night ocean palm queen river snow tiger umbrella violet wolf xray"
          className="w-full h-48 rounded-lg border border-border bg-secondary/50 px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all"
        />
        {lineCount > 0 && (
          <div className="absolute bottom-3 right-3 rounded-md bg-accent px-2 py-1 text-xs text-muted-foreground">
            {lineCount} seed{lineCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeedInput;
