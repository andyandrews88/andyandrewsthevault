import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
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
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            {title && (
              <DrawerHeader className="text-left">
                <DrawerTitle>{title}</DrawerTitle>
              </DrawerHeader>
            )}
            <div className="px-4 pb-6">{children}</div>
          </DrawerContent>
        </Drawer>
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
