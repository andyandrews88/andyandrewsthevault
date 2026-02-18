import { Hash, Lock, Mail, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommunityStore, CommunityChannel } from '@/stores/communityStore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';

interface ChannelSidebarProps {
  onClose?: () => void;
}

function groupChannels(channels: CommunityChannel[]) {
  const groups: Record<string, CommunityChannel[]> = {};
  for (const ch of channels) {
    if (!groups[ch.category]) groups[ch.category] = [];
    groups[ch.category].push(ch);
  }
  return groups;
}

export function ChannelSidebar({ onClose }: ChannelSidebarProps) {
  const {
    channels,
    activeChannelId,
    setActiveChannel,
    unreadDmCount,
    activeDmUserId,
    setActiveDmUser,
    fetchDirectMessages,
  } = useCommunityStore();
  const { user } = useAuthStore();

  const groups = groupChannels(channels);

  const handleChannelClick = (channelId: string) => {
    setActiveChannel(channelId);
    onClose?.();
  };

  const handleDmClick = () => {
    setActiveDmUser(user?.id || null);
    if (user) fetchDirectMessages(user.id);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(220_16%_7%)] border-r border-border">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-bold text-sm tracking-widest text-foreground uppercase">The Vault</span>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {Object.entries(groups).map(([category, chs]) => (
            <div key={category} className="mb-4">
              <p className="px-4 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                {category}
              </p>
              {chs.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleChannelClick(ch.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-sm transition-colors text-left',
                    activeChannelId === ch.id && !activeDmUserId
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  {ch.is_locked ? (
                    <Lock className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                  )}
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          ))}

          {/* Direct Messages section */}
          {user && (
            <div className="mb-4">
              <p className="px-4 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Direct Messages
              </p>
              <button
                onClick={handleDmClick}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-sm transition-colors text-left',
                  activeDmUserId
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate">Coach Messages</span>
                {unreadDmCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 min-w-4 px-1 flex items-center justify-center">
                    {unreadDmCount}
                  </Badge>
                )}
              </button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
