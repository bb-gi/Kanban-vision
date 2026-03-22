import { useRef } from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      onClick={() => inputRef.current?.click()}
      className="relative p-1 rounded hover:bg-white/10 transition-colors"
      title="Changer la couleur"
    >
      <Palette size={14} style={{ color }} />
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      />
    </button>
  );
}
