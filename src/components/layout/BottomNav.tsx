import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BOTTOM_NAV_TABS, MORE_MENU_ITEMS } from "@/lib/navigationConstants";
import { useNotificationStore } from "@/stores/notificationStore";
import { useCommunityStore } from "@/stores/communityStore";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { hasNewAnnouncement } = useNotificationStore();
  const { unreadDmCount } = useCommunityStore();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleMoreItem = async (item: (typeof MORE_MENU_ITEMS)[number]) => {
    setMoreOpen(false);

    if (item.destructive && item.id === "signout") {
      await supabase.auth.signOut();
      navigate("/");
      return;
    }

    if (item.route) {
      navigate(item.route);
      return;
    }

    if (item.tabId) {
      onTabChange(item.tabId);
    }
  };

  const visibleMoreItems = MORE_MENU_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {BOTTOM_NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isMore = tab.id === "more";
            const isActive = isMore ? moreOpen : activeTab === tab.id;
            const showDot =
              tab.id === "community" &&
              (hasNewAnnouncement || unreadDmCount > 0);

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isMore) {
                    setMoreOpen(true);
                  } else {
                    onTabChange(tab.id);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-destructive ring-1 ring-background" />
                  )}
                </div>
                <span className="text-[10px] leading-none font-medium">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Bottom Sheet */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {visibleMoreItems
                .filter((i) => !i.destructive)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMoreItem(item)}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/50 border border-border p-4 min-h-[88px] transition-colors active:bg-muted hover:bg-muted/80"
                    >
                      <Icon
                        className="w-6 h-6 text-foreground"
                        strokeWidth={1.5}
                      />
                      <span className="text-xs font-medium text-foreground leading-none">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
            </div>

            {/* Sign Out */}
            {visibleMoreItems
              .filter((i) => i.destructive)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreItem(item)}
                    className="flex w-full items-center justify-center gap-2 mt-4 rounded-xl border border-destructive/30 py-3 text-destructive transition-colors active:bg-destructive/10"
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
