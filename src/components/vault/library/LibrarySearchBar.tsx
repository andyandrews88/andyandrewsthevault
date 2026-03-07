import { Search } from "lucide-react";

interface LibrarySearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function LibrarySearchBar({ value, onChange }: LibrarySearchBarProps) {
  return (
    <div className="relative group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <input
        type="text"
        placeholder="Search resources..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-full bg-card border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:shadow-glow font-body"
      />
    </div>
  );
}
