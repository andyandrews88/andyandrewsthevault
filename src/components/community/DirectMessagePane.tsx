import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Mail, Shield } from 'lucide-react';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';

export function DirectMessagePane() {
  const { directMessages, markDmsRead, sendDirectMessage, fetchProfile } = useCommunityStore();
  const { user } = useAuthStore();
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // Get all DMs involving this user
  const myDms = directMessages.filter(
    dm => dm.to_user_id === user?.id || dm.from_user_id === user?.id
  );

  // Find the admin sender
  const adminId = myDms.find(dm => dm.from_user_id !== user?.id)?.from_user_id;

  useEffect(() => {
    if (adminId) {
      fetchProfile(adminId).then(p => setAdminProfile(p));
      if (user) markDmsRead(adminId, user.id);
    }
  }, [adminId, user, markDmsRead, fetchProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [myDms.length]);

  const handleSend = async () => {
    if (!reply.trim() || !user || !adminId) return;
    setSending(true);
    try {
      await sendDirectMessage(user.id, adminId, reply.trim());
      setReply('');
    } catch (e) {
      // error handled in store
    } finally {
      setSending(false);
    }
  };

  if (myDms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-semibold mb-2">No messages yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          When your coach sends you a private message, it will appear here.
        </p>
      </div>
    );
  }

  const adminName = adminProfile?.display_name || 'Coach';
  const adminInitials = adminName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* DM Header */}
      <div className="px-4 py-3 border-b border-border bg-[hsl(220_16%_8%)] flex items-center gap-3 flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={adminProfile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-accent/20 text-accent">{adminInitials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{adminName}</span>
            <Badge variant="elite" className="text-[10px] py-0 h-4 px-1.5">
              <Shield className="w-2.5 h-2.5 mr-0.5" />
              Coach
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">Private messages from your coach</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {myDms.map((dm) => {
            const isFromAdmin = dm.from_user_id !== user?.id;
            const senderProfile = isFromAdmin ? adminProfile : null;
            const senderName = isFromAdmin ? adminName : 'You';
            const initials = senderName.slice(0, 2).toUpperCase();

            return (
              <div key={dm.id} className={`flex items-start gap-3 ${!isFromAdmin ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={senderProfile?.avatar_url || undefined} />
                  <AvatarFallback className={`text-xs ${isFromAdmin ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${!isFromAdmin ? 'items-end' : ''} flex flex-col`}>
                  <div className={`flex items-center gap-2 mb-0.5 ${!isFromAdmin ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold">{senderName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(dm.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                    isFromAdmin
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

      {/* Reply input - only if there are DMs (user can reply to coach) */}
      {adminId && (
        <div className="p-3 border-t border-border bg-[hsl(220_16%_8%)]">
          <div className="flex gap-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to your coach..."
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
      )}
    </div>
  );
}
