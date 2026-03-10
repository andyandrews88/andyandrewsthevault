import { BOTTOM_NAV_TABS } from "@/lib/navigationConstants";
import { useNotificationStore } from "@/stores/notificationStore";
import { useCommunityStore } from "@/stores/communityStore";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { hasNewAnnouncement } = useNotificationStore();
  const { unreadDmCount } = useCommunityStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {BOTTOM_NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showDot = tab.id === "community" && (hasNewAnnouncement || unreadDmCount > 0);

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
              <span className="text-[10px] leading-none font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
