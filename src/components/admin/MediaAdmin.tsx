import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Trash2, Plus, Edit2, Save, X, FileText, Play, Headphones } from 'lucide-react';
import { toast } from 'sonner';

type MediaRow = {
  id: string;
  type: 'blog' | 'video' | 'podcast';
  status: string;
  title: string;
  slug: string | null;
  description: string | null;
  body: string | null;
  cover_url: string | null;
  media_url: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
};

const emptyDraft = (): Partial<MediaRow> => ({
  type: 'blog',
  status: 'approved',
  title: '',
  description: '',
  body: '',
  cover_url: '',
  media_url: '',
  tags: [],
});

const MediaAdmin = () => {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'blog' | 'video' | 'podcast'>('all');
  const [draft, setDraft] = useState<Partial<MediaRow> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<Partial<MediaRow>>({});

  const load = async () => {
    const { data } = await supabase.from('media_content').select('*').order('created_at', { ascending: false });
    setRows((data as MediaRow[]) || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (typeFilter === 'all' || r.type === typeFilter)
  );

  const iconFor = (t: string) => t === 'blog' ? FileText : t === 'video' ? Play : Headphones;

  const save = async (id: string | null, values: Partial<MediaRow>) => {
    if (!values.title || !values.type) { toast.error('Title and type are required'); return; }
    const payload: any = {
      type: values.type,
      status: values.status || 'approved',
      title: values.title,
      description: values.description || null,
      body: values.body || null,
      cover_url: values.cover_url || null,
      media_url: values.media_url || null,
      tags: values.tags || [],
      published_at: values.status === 'approved' ? (values.published_at || new Date().toISOString()) : null,
    };
    let error;
    if (id) {
      ({ error } = await supabase.from('media_content').update(payload).eq('id', id));
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      payload.author_id = session?.user.id;
      ({ error } = await supabase.from('media_content').insert(payload as any));
    }
    if (error) { toast.error(error.message); return; }
    toast.success('Saved');
    setDraft(null); setEditingId(null); setEditingRow({});
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const published_at = status === 'approved' ? new Date().toISOString() : null;
    const { error } = await supabase.from('media_content').update({ status, published_at }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Status updated');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from('media_content').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="podcast">Podcast</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setDraft(emptyDraft())} className="gap-1.5">
            <Plus className="w-4 h-4" /> New
          </Button>
        </div>
      </div>

      {draft && (
        <MediaForm
          value={draft}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() => save(null, draft)}
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No media.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const Icon = iconFor(r.type);
            const isEditing = editingId === r.id;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  {isEditing ? (
                    <MediaForm
                      value={editingRow}
                      onChange={setEditingRow}
                      onCancel={() => { setEditingId(null); setEditingRow({}); }}
                      onSave={() => save(r.id, editingRow)}
                    />
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="secondary" className="gap-1"><Icon className="w-3 h-3" />{r.type}</Badge>
                          <Badge variant={r.status === 'approved' ? 'default' : r.status === 'pending' ? 'outline' : 'destructive'}>{r.status}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-medium text-sm truncate">{r.title}</h4>
                        {r.description && <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {r.status !== 'approved' && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'approved')} className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                        {r.status !== 'rejected' && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'rejected')} className="gap-1">
                            <XCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(r.id); setEditingRow(r); }}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MediaForm = ({
  value, onChange, onCancel, onSave,
}: {
  value: Partial<MediaRow>;
  onChange: (v: Partial<MediaRow>) => void;
  onCancel: () => void;
  onSave: () => void;
}) => {
  const upd = (k: keyof MediaRow, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={value.type || 'blog'} onValueChange={(v) => upd('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="podcast">Podcast</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={value.status || 'approved'} onValueChange={(v) => upd('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={value.title || ''} onChange={(e) => upd('title', e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea rows={2} value={value.description || ''} onChange={(e) => upd('description', e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Cover image URL</Label>
          <Input value={value.cover_url || ''} onChange={(e) => upd('cover_url', e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <Label className="text-xs">Media URL (YouTube / Spotify / SoundCloud)</Label>
          <Input value={value.media_url || ''} onChange={(e) => upd('media_url', e.target.value)} placeholder="https://youtube.com/…" />
        </div>
      </div>
      {value.type === 'blog' && (
        <div>
          <Label className="text-xs">Body</Label>
          <Textarea rows={8} value={value.body || ''} onChange={(e) => upd('body', e.target.value)} />
        </div>
      )}
      <div>
        <Label className="text-xs">Tags (comma-separated)</Label>
        <Input
          value={(value.tags || []).join(', ')}
          onChange={(e) => upd('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1"><X className="w-3 h-3" />Cancel</Button>
        <Button size="sm" onClick={onSave} className="gap-1"><Save className="w-3 h-3" />Save</Button>
      </div>
    </div>
  );
};

export default MediaAdmin;
