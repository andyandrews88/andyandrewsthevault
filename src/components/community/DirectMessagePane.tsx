import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Mail, ArrowLeft } from 'lucide-react';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface DirectMessagePaneProps {
  conversationPartnerId: string;
}

export function DirectMessagePane({ conversationPartnerId }: DirectMessagePaneProps) {
  const { directMessages, markDmsRead, sendDirectMessage, fetchProfile, setActiveDmUser } = useCommunityStore();
  const { user } = useAuthStore();
  const { isAdmin } = useAdminCheck();
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // Filter messages to only this specific conversation
  const conversationMessages = directMessages.filter(
    dm =>
      (dm.from_user_id === conversationPartnerId && dm.to_user_id === user?.id) ||
      (dm.from_user_id === user?.id && dm.to_user_id === conversationPartnerId)
  );

  useEffect(() => {
    fetchProfile(conversationPartnerId).then(p => setPartnerProfile(p));
    if (user) markDmsRead(conversationPartnerId, user.id);
  }, [conversationPartnerId, user, markDmsRead, fetchProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);

  const handleSend = async () => {
    if (!reply.trim() || !user) return;
    setSending(true);
    try {
      await sendDirectMessage(user.id, conversationPartnerId, reply.trim());
      setReply('');
    } catch {
      // error handled in store
    } finally {
      setSending(false);
    }
  };

  const partnerName = partnerProfile?.display_name || 'User';
  const partnerInitials = partnerName.slice(0, 2).toUpperCase();

  if (conversationMessages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-[hsl(220_16%_8%)] flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setActiveDmUser(null)} className="md:hidden text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={partnerProfile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-accent/20 text-accent">{partnerInitials}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{partnerName}</span>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">No messages yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Start a conversation with {partnerName}.
          </p>
        </div>
        {/* Reply input */}
        <div className="p-3 border-t border-border bg-[hsl(220_16%_8%)]">
          <div className="flex gap-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={`Message ${partnerName}...`}
              className="flex-1 min-h-[60px] resize-none text-sm"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
              }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!reply.trim() || sending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* DM Header */}
      <div className="px-4 py-3 border-b border-border bg-[hsl(220_16%_8%)] flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setActiveDmUser(null)} className="md:hidden text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={partnerProfile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-accent/20 text-accent">{partnerInitials}</AvatarFallback>
        </Avatar>
        <div>
          <span className="font-semibold text-sm">{partnerName}</span>
          <p className="text-[11px] text-muted-foreground">Private conversation</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {conversationMessages.map((dm) => {
            const isFromMe = dm.from_user_id === user?.id;
            const senderName = isFromMe ? 'You' : partnerName;
            const initials = senderName.slice(0, 2).toUpperCase();

            return (
              <div key={dm.id} className={`flex items-start gap-3 ${isFromMe ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={isFromMe ? undefined : partnerProfile?.avatar_url || undefined} />
                  <AvatarFallback className={`text-xs ${!isFromMe ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isFromMe ? 'items-end' : ''} flex flex-col`}>
                  <div className={`flex items-center gap-2 mb-0.5 ${isFromMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold">{senderName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(dm.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                    !isFromMe
                      ? 'bg-accent/10 border border-accent/20 text-foreground'
                      : 'bg-primary/10 border border-primary/20 text-foreground'
                  }`}>
                    {dm.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply input */}
      <div className="p-3 border-t border-border bg-[hsl(220_16%_8%)]">
        <div className="flex gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Message ${partnerName}...`}
            className="flex-1 min-h-[60px] resize-none text-sm"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
