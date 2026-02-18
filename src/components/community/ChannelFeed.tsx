import { useEffect, useRef, useState } from 'react';
import { Hash, Lock, PlusCircle, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import { MessageItem } from './MessageItem';
import { ThreadDrawer } from './ThreadDrawer';
import { Link } from 'react-router-dom';

const MAX_CONTENT_LENGTH = 5000;

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

  // Fetch user likes on mount
  useEffect(() => {
    if (user) fetchUserLikes(user.id);
  }, [user, fetchUserLikes]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const handleSubmit = async () => {
    if (!content.trim() || !user || content.length > MAX_CONTENT_LENGTH || isSubmitting) return;

    setIsSubmitting(true);
    const text = content.trim();
    setContent('');
    try {
      await createPost(text, user.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const isLocked = activeChannel?.is_locked && !user;
  const isOverLimit = content.length > MAX_CONTENT_LENGTH;

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="px-4 py-3 border-b border-border bg-[hsl(220_16%_8%)] flex items-center gap-2 flex-shrink-0">
        {activeChannel?.is_locked ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Hash className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="font-semibold text-sm">{activeChannel?.name || 'general'}</span>
        {activeChannel?.description && (
          <>
            <span className="text-border">|</span>
            <span className="text-xs text-muted-foreground truncate">{activeChannel.description}</span>
          </>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-4 px-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Hash className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">#{activeChannel?.name}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {activeChannel?.description || 'Be the first to post in this channel!'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {posts.map((post) => (
                <MessageItem key={post.id} post={post} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-border bg-[hsl(220_16%_8%)] flex-shrink-0">
        {!user ? (
          <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link>{' '}
              to join the conversation
            </p>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${activeChannel?.name || 'general'}`}
                className={`min-h-[44px] max-h-[200px] resize-none pr-12 bg-secondary/50 border-border text-sm ${
                  isOverLimit ? 'border-destructive' : ''
                }`}
                disabled={isSubmitting}
              />
              {content.length > MAX_CONTENT_LENGTH * 0.9 && (
                <p className={`absolute bottom-1 right-2 text-[10px] ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </p>
              )}
            </div>
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || isOverLimit}
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Thread Drawer */}
      <ThreadDrawer />
    </div>
  );
}
