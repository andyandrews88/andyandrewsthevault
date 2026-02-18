import { useState } from 'react';
import { Hash, Lock, Mail, X, Pencil, Trash2, Plus, Check, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommunityStore, CommunityChannel } from '@/stores/communityStore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/stores/notificationStore';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ChannelSidebarProps {
  onClose?: () => void;
}

function groupChannels(channels: CommunityChannel[]) {
  const groups: Record<string, CommunityChannel[]> = {};
  for (const ch of channels) {
    if (!groups[ch.category]) groups[ch.category] = [];
    groups[ch.category].push(ch);
  }
  return groups;
}

const CATEGORIES = ['THE VAULT', 'TRAINING', 'LIFESTYLE'];

interface EditChannelDialogProps {
  channel: CommunityChannel;
  open: boolean;
  onClose: () => void;
}

function EditChannelDialog({ channel, open, onClose }: EditChannelDialogProps) {
  const { updateChannel } = useCommunityStore();
  const { toast } = useToast();
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || '');
  const [category, setCategory] = useState(channel.category);
  const [isLocked, setIsLocked] = useState(channel.is_locked);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateChannel(channel.id, {
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description.trim() || null,
        category,
        is_locked: isLocked,
      });
      toast({ title: 'Channel updated' });
      onClose();
    } catch {
      toast({ title: 'Failed to update channel', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ch-name">Channel Name</Label>
            <Input
              id="ch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="general"
            />
            <p className="text-[11px] text-muted-foreground">Lowercase, hyphens only. Shown as #{name.toLowerCase().replace(/\s+/g, '-')}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ch-desc">Description</Label>
            <Textarea
              id="ch-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel for?"
              className="resize-none min-h-[72px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ch-locked">Locked Channel</Label>
              <p className="text-[11px] text-muted-foreground">Only admins can post</p>
            </div>
            <Switch id="ch-locked" checked={isLocked} onCheckedChange={setIsLocked} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NewChannelDialogProps {
  open: boolean;
  onClose: () => void;
}

function NewChannelDialog({ open, onClose }: NewChannelDialogProps) {
  const { createChannel } = useCommunityStore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('THE VAULT');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createChannel(
        name.trim().toLowerCase().replace(/\s+/g, '-'),
        description.trim(),
        category
      );
      toast({ title: 'Channel created' });
      setName('');
      setDescription('');
      onClose();
    } catch {
      toast({ title: 'Failed to create channel', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-name">Channel Name</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. q-and-a"
            />
            {name && (
              <p className="text-[11px] text-muted-foreground">#{name.toLowerCase().replace(/\s+/g, '-')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-desc">Description</Label>
            <Textarea
              id="new-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel for?"
              className="resize-none min-h-[72px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? 'Creating…' : 'Create Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChannelSidebar({ onClose }: ChannelSidebarProps) {
  const {
    channels,
    activeChannelId,
    setActiveChannel,
    unreadDmCount,
    activeDmUserId,
    setActiveDmUser,
    fetchDirectMessages,
    deleteChannel,
  } = useCommunityStore();
  const { user } = useAuthStore();
  const { isAdmin } = useAdminCheck();
  const { toast } = useToast();
  const { hasNewAnnouncement, markAnnouncementsRead } = useNotificationStore();

  const [editingChannel, setEditingChannel] = useState<CommunityChannel | null>(null);
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const groups = groupChannels(channels);

  const handleChannelClick = (channelId: string, channelName: string) => {
    setActiveChannel(channelId);
    if (channelName === 'announcements') {
      markAnnouncementsRead();
    }
    onClose?.();
  };

  const handleDmClick = () => {
    setActiveDmUser(user?.id || null);
    if (user) fetchDirectMessages(user.id);
    onClose?.();
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await deleteChannel(channelId);
      toast({ title: 'Channel deleted' });
    } catch {
      toast({ title: 'Failed to delete channel', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(220_16%_7%)] border-r border-border">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span className="font-bold text-sm tracking-widest text-foreground uppercase">The Vault</span>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={() => setAdminMode((v) => !v)}
              title="Toggle admin editing mode"
              className={cn(
                'p-1 rounded transition-colors',
                adminMode
                  ? 'text-primary bg-primary/15'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Admin mode banner */}
      {isAdmin && adminMode && (
        <div className="px-3 py-1.5 bg-primary/10 border-b border-primary/20 flex-shrink-0">
          <p className="text-[10px] text-primary font-medium tracking-wide">ADMIN EDITING MODE</p>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-2">
          {Object.entries(groups).map(([category, chs]) => (
            <div key={category} className="mb-4">
              <div className="flex items-center justify-between px-4 py-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {category}
                </p>
                {isAdmin && adminMode && (
                  <button
                    onClick={() => setNewChannelOpen(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Add channel"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {chs.map((ch) => (
                <div key={ch.id} className="group/ch relative">
                  <button
                    onClick={() => !adminMode && handleChannelClick(ch.id, ch.name)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-sm transition-colors text-left',
                      activeChannelId === ch.id && !activeDmUserId && !adminMode
                        ? 'bg-primary/15 text-primary font-medium'
                        : adminMode
                        ? 'text-foreground/70 hover:bg-secondary/40'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                      adminMode && 'pr-16'
                    )}
                    style={{ pointerEvents: adminMode ? 'none' : undefined }}
                  >
                    {ch.is_locked ? (
                      <Lock className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    ) : (
                      <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    )}
                    <span className="truncate">{ch.name}</span>
                    {ch.name === 'announcements' && hasNewAnnouncement && !adminMode && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                    )}
                    {ch.is_locked && ch.name !== 'announcements' && (
                      <span className="ml-auto text-[9px] text-muted-foreground/60 uppercase tracking-wide">locked</span>
                    )}
                    {ch.is_locked && ch.name === 'announcements' && !hasNewAnnouncement && (
                      <span className="ml-auto text-[9px] text-muted-foreground/60 uppercase tracking-wide">locked</span>
                    )}
                  </button>

                  {/* Admin action buttons, shown inline */}
                  {isAdmin && adminMode && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <button
                        onClick={() => setEditingChannel(ch)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                        title="Edit channel"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete channel"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete #{ch.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the channel and all its messages. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDeleteChannel(ch.id)}
                            >
                              Delete Channel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Add channel button (when no groups yet or as standalone CTA) */}
          {isAdmin && adminMode && (
            <div className="px-3 mb-4">
              <button
                onClick={() => setNewChannelOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border border-dashed border-border/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Channel</span>
              </button>
            </div>
          )}

          {/* Direct Messages section */}
          {user && (
            <div className="mb-4">
              <p className="px-4 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Direct Messages
              </p>
              <button
                onClick={handleDmClick}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-sm transition-colors text-left',
                  activeDmUserId
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate">Coach Messages</span>
                {unreadDmCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 min-w-4 px-1 flex items-center justify-center">
                    {unreadDmCount}
                  </Badge>
                )}
              </button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Edit channel dialog */}
      {editingChannel && (
        <EditChannelDialog
          channel={editingChannel}
          open={!!editingChannel}
          onClose={() => setEditingChannel(null)}
        />
      )}

      {/* New channel dialog */}
      <NewChannelDialog
        open={newChannelOpen}
        onClose={() => setNewChannelOpen(false)}
      />
    </div>
  );
}
