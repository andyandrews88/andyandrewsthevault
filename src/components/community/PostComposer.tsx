import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';

interface PostComposerProps {
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
}

const MAX_CONTENT_LENGTH = 5000;

export function PostComposer({ parentId, placeholder, onSuccess }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost, createReply } = useCommunityStore();
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!content.trim() || !user || content.length > MAX_CONTENT_LENGTH) return;

    setIsSubmitting(true);
    try {
      if (parentId) {
        await createReply(content.trim(), parentId, user.id);
      } else {
        await createPost(content.trim(), user.id);
      }
      setContent('');
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (!user) {
    return (
      <div className="p-4 rounded-lg border bg-muted/50 text-center text-sm text-muted-foreground">
        Sign in to join the conversation
      </div>
    );
  }

  const isOverLimit = content.length > MAX_CONTENT_LENGTH;

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <Textarea
          placeholder={placeholder || 'Share your progress or ask a question...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 min-h-[80px] resize-none ${isOverLimit ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
          maxLength={MAX_CONTENT_LENGTH + 100} // Allow slight overage for UX, but validation blocks submit
        />
        <Button
          variant="default"
          size="icon"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting || isOverLimit}
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {content.length > MAX_CONTENT_LENGTH * 0.9 && (
        <p className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
          {content.length}/{MAX_CONTENT_LENGTH} characters
        </p>
      )}
    </div>
  );
}
