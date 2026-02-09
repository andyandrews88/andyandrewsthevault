import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunityStore } from '@/stores/communityStore';
import { useCommunityRealtime } from '@/hooks/useCommunityRealtime';
import { useAuthStore } from '@/stores/authStore';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';
import { ThreadDrawer } from './ThreadDrawer';

export function CommunityFeed() {
  const { posts, isLoading, fetchUserLikes } = useCommunityStore();
  const { user } = useAuthStore();

  // Subscribe to realtime updates
  useCommunityRealtime();

  // Fetch user's likes when logged in
  useEffect(() => {
    if (user) {
      fetchUserLikes(user.id);
    }
  }, [user, fetchUserLikes]);

  return (
    <>
      <div className="space-y-6">
        {/* Page Description */}
        <div className="text-center mb-6">
          <Badge variant="elite" className="mb-3">COMMUNITY HUB</Badge>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Connect & Share</h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Share your progress, ask questions, and connect with fellow athletes on their performance journey.
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Community Feed</CardTitle>
            <CardDescription>Share insights, ask questions, and connect with fellow athletes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* New post composer */}
            <PostComposer />

            {/* Posts */}
            <div className="space-y-4">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No posts yet. Be the first to share!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thread Drawer */}
      <ThreadDrawer />
    </>
  );
}
