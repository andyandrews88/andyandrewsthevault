import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Star } from 'lucide-react';
import { useCommunityStore, CommunityMessage } from '@/stores/communityStore';
import { LikeButton } from './LikeButton';
import { PostComposer } from './PostComposer';

function ReplyItem({ reply }: { reply: CommunityMessage }) {
  const profile = reply.user_profile;
  const displayName = profile?.display_name || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isCoach = profile?.is_coach || false;
  const timeAgo = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true });

  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm">{displayName}</span>
            {isCoach && (
              <Badge variant="elite" className="text-xs py-0 h-4">
                <Star className="w-2 h-2 mr-0.5" />
                Coach
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {reply.content}
          </p>

          <div className="mt-2">
            <LikeButton messageId={reply.id} likesCount={reply.likes_count} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThreadDrawer() {
  const { threadDrawerOpen, closeThreadDrawer, currentThread, threadReplies } = useCommunityStore();

  if (!currentThread) return null;

  const profile = currentThread.user_profile;
  const displayName = profile?.display_name || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isCoach = profile?.is_coach || false;
  const timeAgo = formatDistanceToNow(new Date(currentThread.created_at), { addSuffix: true });

  return (
    <Sheet open={threadDrawerOpen} onOpenChange={(open) => !open && closeThreadDrawer()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Thread</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Original Post */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">{displayName}</span>
                    {isCoach && (
                      <Badge variant="elite" className="text-xs py-0 h-5">
                        <Star className="w-3 h-3 mr-1" />
                        Coach
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                  </div>

                  <p className="text-sm whitespace-pre-wrap break-words">
                    {currentThread.content}
                  </p>

                  <div className="mt-3">
                    <LikeButton messageId={currentThread.id} likesCount={currentThread.likes_count} />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Replies */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Replies ({threadReplies.length})
              </h4>

              {threadReplies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No replies yet. Be the first to respond!
                </p>
              ) : (
                threadReplies.map((reply) => (
                  <ReplyItem key={reply.id} reply={reply} />
                ))
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Reply Input */}
        <div className="p-4 border-t bg-background">
          <PostComposer
            parentId={currentThread.id}
            placeholder="Write a reply..."
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
