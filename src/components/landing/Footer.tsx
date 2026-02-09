import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <span className="font-mono text-primary font-bold text-sm">V</span>
            </div>
            <span className="font-semibold">The Vault</span>
          </div>

          <nav className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2026 Andy Andrews. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
