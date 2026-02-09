import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  messageId: string;
  likesCount: number;
}

export function LikeButton({ messageId, likesCount }: LikeButtonProps) {
  const { userLikes, toggleLike } = useCommunityStore();
  const { user } = useAuthStore();
  const isLiked = userLikes.has(messageId);

  const handleClick = () => {
    if (!user) return;
    toggleLike(messageId, user.id);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        'gap-1 text-xs h-7 px-2',
        isLiked && 'text-destructive hover:text-destructive/80'
      )}
      disabled={!user}
    >
      <Heart className={cn('w-3 h-3', isLiked && 'fill-current')} />
      {likesCount > 0 && <span>{likesCount}</span>}
    </Button>
  );
}
