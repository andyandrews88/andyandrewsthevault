import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BottomSheetMenu,
} from "@/components/ui/bottom-sheet-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  /** PopoverContent props for desktop */
  popoverAlign?: "start" | "center" | "end";
  popoverClassName?: string;
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  popoverAlign = "center",
  popoverClassName,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {trigger && (
          <div onClick={() => onOpenChange(true)} className="contents">
            {trigger}
          </div>
        )}
        <BottomSheetMenu open={open} onOpenChange={onOpenChange} title={title}>
          {children}
        </BottomSheetMenu>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent align={popoverAlign} className={popoverClassName}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
