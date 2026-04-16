import { useEffect, useRef, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

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

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [reply, autoResize]);

  const handleSend = async () => {
    if (!reply.trim() || !user) return;
    setSending(true);
    try {
      await sendDirectMessage(user.id, conversationPartnerId, reply.trim());
      setReply('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch {
      // error handled in store
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const partnerName = partnerProfile?.display_name || 'User';
  const partnerInitials = partnerName.slice(0, 2).toUpperCase();

  const renderHeader = () => (
    <div className="px-4 h-9 border-b border-border bg-background flex items-center gap-3 flex-shrink-0">
      <button onClick={() => setActiveDmUser(null)} className="md:hidden text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <Avatar className="h-6 w-6">
        <AvatarImage src={partnerProfile?.avatar_url || undefined} />
        <AvatarFallback className="text-[10px] bg-accent/20 text-accent">{partnerInitials}</AvatarFallback>
      </Avatar>
      <span className="font-semibold text-sm">{partnerName}</span>
    </div>
  );

  const renderInput = () => (
    <div className="px-3 py-2 border-t border-border bg-background flex-shrink-0">
      <div className="flex items-end gap-2 bg-secondary/40 rounded-2xl border border-border px-3 py-1.5">
        <textarea
          ref={textareaRef}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${partnerName}...`}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none border-0 outline-none placeholder:text-muted-foreground py-1.5 max-h-[120px] text-foreground"
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!reply.trim() || sending}
          className="flex-shrink-0 h-7 w-7 rounded-full"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );

  if (conversationMessages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Start of your conversation</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Send a message to {partnerName}.
          </p>
        </div>
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {renderHeader()}

      <ScrollArea className="flex-1">
        <div className="py-2 space-y-1">
          {conversationMessages.map((dm, index) => {
            const isFromMe = dm.from_user_id === user?.id;
            const senderName = isFromMe ? 'You' : partnerName;
            const initials = senderName.slice(0, 2).toUpperCase();

            // Grouping
            const prev = index > 0 ? conversationMessages[index - 1] : null;
            const sameUser = prev && prev.from_user_id === dm.from_user_id;
            const timeDiff = prev ? new Date(dm.created_at).getTime() - new Date(prev.created_at).getTime() : Infinity;
            const grouped = sameUser && timeDiff < 5 * 60 * 1000;

            return (
              <div key={dm.id} className={`flex items-start gap-3 px-4 ${grouped ? 'py-0.5' : 'py-1.5 mt-1'} ${isFromMe ? 'flex-row-reverse' : ''}`}>
                {grouped ? (
                  <div className="w-6 flex-shrink-0" />
                ) : (
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={isFromMe ? undefined : partnerProfile?.avatar_url || undefined} />
                    <AvatarFallback className={`text-[10px] ${!isFromMe ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] ${isFromMe ? 'items-end' : ''} flex flex-col`}>
                  {!grouped && (
                    <div className={`flex items-center gap-2 mb-0.5 ${isFromMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold">{senderName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(dm.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  <div className={`px-3 py-1.5 rounded-xl text-sm leading-relaxed ${
                    !isFromMe
                      ? 'bg-secondary/60 text-foreground'
                      : 'bg-primary/15 text-foreground'
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

      {renderInput()}
    </div>
  );
}
