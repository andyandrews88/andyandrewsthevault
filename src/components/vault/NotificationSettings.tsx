import { useState } from 'react';
import { Bell, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';

export function NotificationSettings() {
  const { prefs, saveNotificationPrefs } = useNotificationStore();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);

  const handleToggle = (key: 'announcement_alerts' | 'pr_badge_alerts', value: boolean) => {
    if (!user) return;
    saveNotificationPrefs(user.id, { ...prefs, [key]: value });
  };

  const content = (
    <>
      <div className="mb-3">
        <p className="text-sm font-semibold">Notification Settings</p>
        <p className="text-xs text-muted-foreground mt-0.5">Control which in-app alerts you see</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <Label htmlFor="toggle-announcements" className="text-sm font-medium cursor-pointer">
              Announcement alerts
            </Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Red dot when a new announcement is posted
            </p>
          </div>
          <Switch
            id="toggle-announcements"
            checked={prefs.announcement_alerts}
            onCheckedChange={(v) => handleToggle('announcement_alerts', v)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <Label htmlFor="toggle-pr" className="text-sm font-medium cursor-pointer">
              PR badge alerts
            </Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Badge when a new personal record is logged
            </p>
          </div>
          <Switch
            id="toggle-pr"
            checked={prefs.pr_badge_alerts}
            onCheckedChange={(v) => handleToggle('pr_badge_alerts', v)}
          />
        </div>
      </div>
      <div className="border-t pt-3 mt-3">
        <button
          onClick={() => {
            localStorage.removeItem('vault_onboarding_complete');
            window.location.reload();
          }}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Replay Onboarding
        </button>
      </div>
    </>
  );

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={setOpen}
      title="Notification Settings"
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Notification settings">
          <Bell className="w-4 h-4" />
        </Button>
      }
      popoverAlign="end"
      popoverClassName="w-72 p-4"
    >
      {content}
    </ResponsiveSheet>
  );
}
