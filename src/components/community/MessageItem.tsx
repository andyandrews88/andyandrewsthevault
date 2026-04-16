import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Star, Trash2, Shield, Pencil, Check, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface MessageItemProps {
  post: CommunityMessage;
  compact?: boolean;
  grouped?: boolean;
}

export function MessageItem({ post, compact = false, grouped = false }: MessageItemProps) {
  const { openThreadDrawer, deletePost, updatePost } = useCommunityStore();
  const { user } = useAuthStore();
  const { isAdmin } = useAdminCheck();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  const profile = post.user_profile;
  const displayName = profile?.display_name || 'Member';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isCoach = profile?.is_coach || false;
  const canDelete = user?.id === post.user_id || isAdmin;
  const canEdit = user?.id === post.user_id || isAdmin;
  const isOptimistic = post.isOptimistic;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      setEditContent(post.content);
      return;
    }
    setIsSaving(true);
    await updatePost(post.id, editContent.trim());
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  // Grouped message — just content, indented under avatar space
  if (grouped && !isEditing) {
    return (
      <div
        className={cn(
          'group flex items-start gap-3 px-4 py-0.5 hover:bg-secondary/20 transition-colors',
          isOptimistic && 'opacity-60'
        )}
      >
        {/* Spacer matching avatar width */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity select-none">
            {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>

          {/* Reply count — always visible */}
          {!compact && post.reply_count > 0 && (
            <button
              onClick={() => openThreadDrawer(post)}
              className="flex items-center gap-1 mt-0.5 text-xs text-primary hover:underline"
            >
              <MessageSquare className="w-3 h-3" />
              {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {/* Hover actions */}
          {!compact && (
            <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!post.reply_count && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => openThreadDrawer(post)}
                >
                  <MessageSquare className="w-3 h-3" />
                  Reply
                </Button>
              )}
              <LikeButton messageId={post.id} likesCount={post.likes_count} />
              {canEdit && !isOptimistic && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setEditContent(post.content); setIsEditing(true); }}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
              {canDelete && !isOptimistic && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete this message and all its replies.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePost(post.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-1.5 hover:bg-secondary/20 transition-colors',
        isOptimistic && 'opacity-60',
        compact && 'py-1',
        !grouped && 'mt-1'
      )}
    >
      <Avatar className={cn('flex-shrink-0', compact ? 'h-7 w-7' : 'h-8 w-8')}>
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm text-foreground">{displayName}</span>
          {isCoach && (
            <Badge variant="elite" className="text-[10px] py-0 h-4 px-1.5">
              <Shield className="w-2.5 h-2.5 mr-0.5" />
              Coach
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
          {isOptimistic && <span className="text-[10px] text-muted-foreground italic">sending...</span>}
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-1">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] text-sm bg-secondary/50 border-border resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit();
              }}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()}>
                <Check className="w-3 h-3" /> Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="w-3 h-3" /> Cancel
              </Button>
              <span className="text-[10px] text-muted-foreground">Ctrl+Enter to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>
        )}

        {/* Reply count — always visible when > 0 */}
        {!compact && !isEditing && post.reply_count > 0 && (
          <button
            onClick={() => openThreadDrawer(post)}
            className="flex items-center gap-1 mt-0.5 text-xs text-primary hover:underline"
          >
            <MessageSquare className="w-3 h-3" />
            {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {!compact && !isEditing && (
          <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {!post.reply_count && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => openThreadDrawer(post)}
              >
                <MessageSquare className="w-3 h-3" />
                Reply
              </Button>
            )}
            <LikeButton messageId={post.id} likesCount={post.likes_count} />
            {canEdit && !isOptimistic && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => { setEditContent(post.content); setIsEditing(true); }}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
            {canDelete && !isOptimistic && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete this message and all its replies.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deletePost(post.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
