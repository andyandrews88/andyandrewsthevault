import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Star, Trash2 } from 'lucide-react';
import { CommunityMessage, useCommunityStore } from '@/stores/communityStore';
import { LikeButton } from './LikeButton';
import { useAuthStore } from '@/stores/authStore';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PostCardProps {
  post: CommunityMessage;
}

export function PostCard({ post }: PostCardProps) {
  const { openThreadDrawer, deletePost } = useCommunityStore();
  const { user } = useAuthStore();
  const { isAdmin } = useAdminCheck();

  const profile = post.user_profile;
  const displayName = profile?.display_name || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isCoach = profile?.is_coach || false;
  const canDelete = user?.id === post.user_id || isAdmin;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="p-3 rounded-md border border-border bg-card">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
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

          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {post.content}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-7 px-2"
              onClick={() => openThreadDrawer(post)}
            >
              <MessageSquare className="w-3 h-3" />
              {post.reply_count || 0} Replies
            </Button>

            <LikeButton messageId={post.id} likesCount={post.likes_count} />

            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 ml-auto text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this post and all its replies.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deletePost(post.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
