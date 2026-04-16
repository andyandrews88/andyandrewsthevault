import { useEffect, useRef, useState, useCallback } from 'react';
import { Hash, Lock, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunityStore, CommunityMessage } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import { MessageItem } from './MessageItem';
import { ThreadDrawer } from './ThreadDrawer';
import { Link } from 'react-router-dom';

const MAX_CONTENT_LENGTH = 5000;

function shouldGroup(current: CommunityMessage, prev: CommunityMessage | null): boolean {
  if (!prev) return false;
  if (current.user_id !== prev.user_id) return false;
  const diff = new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 5 * 60 * 1000;
}

export function ChannelFeed() {
  const {
    posts,
    isLoading,
    activeChannelId,
    channels,
    createPost,
    fetchUserLikes,
  } = useCommunityStore();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  useEffect(() => {
    if (user) fetchUserLikes(user.id);
  }, [user, fetchUserLikes]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  const handleSubmit = async () => {
    if (!content.trim() || !user || content.length > MAX_CONTENT_LENGTH || isSubmitting) return;
    setIsSubmitting(true);
    const text = content.trim();
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      await createPost(text, user.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isOverLimit = content.length > MAX_CONTENT_LENGTH;

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header — compact 36px */}
      <div className="px-4 h-9 border-b border-border bg-background flex items-center gap-2 flex-shrink-0">
        {activeChannel?.is_locked ? (
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Hash className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span className="font-semibold text-sm">{activeChannel?.name || 'general'}</span>
        {activeChannel?.description && (
          <>
            <span className="text-border mx-1">·</span>
            <span className="text-xs text-muted-foreground truncate">{activeChannel.description}</span>
          </>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {isLoading ? (
            <div className="space-y-3 px-4 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">This is the start of #{activeChannel?.name || 'general'}</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                {activeChannel?.description || 'Be the first to post in this channel!'}
              </p>
            </div>
          ) : (
            <div>
              {posts.map((post, index) => {
                const prev = index > 0 ? posts[index - 1] : null;
                const grouped = shouldGroup(post, prev);
                return (
                  <MessageItem key={post.id} post={post} grouped={grouped} />
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Message Input — sleek pill bar */}
      <div className="px-3 py-2 border-t border-border bg-background flex-shrink-0">
        {!user ? (
          <div className="rounded-full border border-border bg-secondary/30 px-4 py-2.5 text-center">
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link>{' '}
              to join the conversation
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-2 bg-secondary/40 rounded-2xl border border-border px-3 py-1.5">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeChannel?.name || 'general'}`}
              rows={1}
              className={`flex-1 bg-transparent text-sm resize-none border-0 outline-none placeholder:text-muted-foreground py-1.5 max-h-[120px] ${
                isOverLimit ? 'text-destructive' : 'text-foreground'
              }`}
              disabled={isSubmitting}
            />
            {content.length > MAX_CONTENT_LENGTH * 0.9 && (
              <span className={`text-[10px] flex-shrink-0 pb-1.5 ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            )}
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || isOverLimit}
              className="flex-shrink-0 h-7 w-7 rounded-full"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <ThreadDrawer />
    </div>
  );
}
