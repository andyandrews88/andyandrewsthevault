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

export function PostComposer({ parentId, placeholder, onSuccess }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost, createReply } = useCommunityStore();
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

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

  return (
    <div className="flex gap-3">
      <Textarea
        placeholder={placeholder || 'Share your progress or ask a question...'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-h-[80px] resize-none"
        disabled={isSubmitting}
      />
      <Button
        variant="default"
        size="icon"
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        className="self-end"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
