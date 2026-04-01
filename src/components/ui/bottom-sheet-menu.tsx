/**
 * BottomSheetMenu — Universal bottom sheet menu component.
 * Use this for ALL menus, option lists, pickers, and selection UIs.
 * 
 * Features:
 * - 24px rounded top corners
 * - Handle bar + close X
 * - Bold centered title
 * - 64px min-height rows with outlined icons
 * - Red destructive items
 * - Checkmark for selected items
 * - Scrollable content
 */

import * as React from "react";
import { Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/* ───── Root ───── */
interface BottomSheetMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheetMenu({ open, onOpenChange, title, children }: BottomSheetMenuProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {title && (
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
        )}
        <div className="overflow-y-auto px-4 pb-6 space-y-0.5">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

/* ───── Menu Item Row ───── */
interface BottomSheetItemProps {
  icon?: React.ElementType;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function BottomSheetItem({
  icon: Icon,
  label,
  onClick,
  destructive,
  selected,
  disabled,
  className,
}: BottomSheetItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl px-4 min-h-[64px] transition-colors active:bg-white/5",
        destructive
          ? "text-destructive"
          : "text-foreground hover:bg-white/[0.03]",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-6 w-6 shrink-0",
            destructive ? "text-destructive" : "text-foreground"
          )}
          strokeWidth={1.5}
        />
      )}
      <span className="flex-1 text-left text-[17px] font-medium leading-tight">{label}</span>
      {selected && <Check className="h-5 w-5 text-primary shrink-0" />}
    </button>
  );
}

/* ───── Section Divider ───── */
export function BottomSheetSeparator({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="px-4 pt-4 pb-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    );
  }
  return <div className="h-px bg-border mx-4 my-1" />;
}

/* ───── Expandable Sub-Section ───── */
interface BottomSheetExpandableProps {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function BottomSheetExpandable({ icon: Icon, label, children, defaultOpen = false }: BottomSheetExpandableProps) {
  const [expanded, setExpanded] = React.useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 rounded-xl px-4 min-h-[64px] text-foreground transition-colors hover:bg-white/[0.03] active:bg-white/5"
      >
        {Icon && <Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />}
        <span className="flex-1 text-left text-[17px] font-medium leading-tight">{label}</span>
        <svg
          className={cn("h-5 w-5 text-muted-foreground transition-transform", expanded && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="ml-10 mr-4 mb-1 space-y-0.5 border-l-2 border-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ───── Sub-Item (for inside expandable sections) ───── */
interface BottomSheetSubItemProps {
  label: string;
  onClick: () => void;
  selected?: boolean;
}

export function BottomSheetSubItem({ label, onClick, selected }: BottomSheetSubItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-[#1a1a1a] dark:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03] active:bg-black/5 transition-colors"
    >
      <span>{label}</span>
      {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
    </button>
  );
}
