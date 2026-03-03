import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useCommunityStore } from '@/stores/communityStore';
import { useCommunityRealtime } from '@/hooks/useCommunityRealtime';
import { useAuthStore } from '@/stores/authStore';
import { ChannelSidebar } from './ChannelSidebar';
import { ChannelFeed } from './ChannelFeed';
import { DirectMessagePane } from './DirectMessagePane';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function CommunityFeed() {
  const { fetchChannels, activeDmUserId, fetchDirectMessages, channels, activeChannelId, dmConversations } = useCommunityStore();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useCommunityRealtime();

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (user) fetchDirectMessages(user.id);
  }, [user, fetchDirectMessages]);

  // Find conversation partner name for mobile header
  const activeConvPartner = activeDmUserId
    ? dmConversations.find(c => c.partnerId === activeDmUserId)?.partnerProfile?.display_name || 'Messages'
    : null;

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '520px' }}>
      {/* Desktop layout */}
      <div className="hidden md:flex h-full">
        <div className="w-56 flex-shrink-0">
          <ChannelSidebar />
        </div>
        <div className="flex-1 min-w-0">
          {activeDmUserId ? <DirectMessagePane conversationPartnerId={activeDmUserId} /> : <ChannelFeed />}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col h-full md:hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[hsl(220_16%_7%)] flex-shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-[hsl(220_16%_7%)] border-border">
              <ChannelSidebar onClose={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium text-muted-foreground">
            {activeConvPartner || (channels.find(c => c.id === activeChannelId)?.name ? `#${channels.find(c => c.id === activeChannelId)?.name}` : 'Community')}
          </span>
        </div>

        <div className="flex-1 min-h-0">
          {activeDmUserId ? <DirectMessagePane conversationPartnerId={activeDmUserId} /> : <ChannelFeed />}
        </div>
      </div>
    </div>
  );
}
