import { useEffect, useState } from 'react';
import { Menu, Hash } from 'lucide-react';
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

  const activeConvPartner = activeDmUserId
    ? dmConversations.find(c => c.partnerId === activeDmUserId)?.partnerProfile?.display_name || 'Messages'
    : null;

  const activeChannelName = channels.find(c => c.id === activeChannelId)?.name;

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-180px)] flex flex-col">
      {/* Desktop layout */}
      <div className="hidden md:flex h-full">
        <div className="w-56 flex-shrink-0 border-r border-border">
          <ChannelSidebar />
        </div>
        <div className="flex-1 min-w-0">
          {activeDmUserId ? <DirectMessagePane conversationPartnerId={activeDmUserId} /> : <ChannelFeed />}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col h-full md:hidden">
        <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-background flex-shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-background border-border">
              <ChannelSidebar onClose={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          {activeConvPartner ? (
            <span className="text-sm font-medium">{activeConvPartner}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{activeChannelName || 'general'}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {activeDmUserId ? <DirectMessagePane conversationPartnerId={activeDmUserId} /> : <ChannelFeed />}
        </div>
      </div>
    </div>
  );
}
