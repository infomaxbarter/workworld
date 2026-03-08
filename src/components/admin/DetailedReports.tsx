import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Users, MapPin, CalendarDays, Briefcase, TrendingUp, Globe, Clock, AlertTriangle, FileText, MessageSquare } from 'lucide-react';

const COLORS = ['hsl(152,60%,36%)', 'hsl(200,60%,50%)', 'hsl(40,80%,50%)', 'hsl(350,60%,50%)', 'hsl(270,60%,50%)', 'hsl(180,50%,45%)', 'hsl(20,80%,50%)', 'hsl(300,50%,55%)'];

const DetailedReports = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [anonMembers, setAnonMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [professions, setProfessions] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [profileProfs, setProfileProfs] = useState<any[]>([]);
  const [anonProfs, setAnonProfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '90d' | '1y'>('all');

  useEffect(() => {
    const load = async () => {
      const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10] = await Promise.all([
        supabase.from('profiles').select('id, user_id, display_name, approved, city, country, status, created_at'),
        supabase.from('user_markers').select('id, name, city, country, status, created_at'),
        supabase.from('event_markers').select('id, title, city, country, status, start_date, date, created_at'),
        supabase.from('professions').select('id, name, status, created_at'),
        supabase.from('posts').select('id, status, target_type, created_at'),
        supabase.from('comments').select('id, status, target_type, created_at'),
        supabase.from('reports').select('id, type, reason, created_at'),
        supabase.from('submissions').select('id, created_at'),
        supabase.from('profile_professions').select('profile_id, profession_id'),
        supabase.from('user_marker_professions' as any).select('user_marker_id, profession_id'),
      ]);
      setProfiles(r1.data || []);
      setAnonMembers(r2.data || []);
      setEvents(r3.data || []);
      setProfessions(r4.data || []);
      setPosts(r5.data || []);
      setComments(r6.data || []);
      setReports(r7.data || []);
      setSubmissions(r8.data || []);
      setProfileProfs(r9.data || []);
      setAnonProfs((r10.data as any[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filterByTime = (items: any[], dateField = 'created_at') => {
    if (timeRange === 'all') return items;
    const now = new Date();
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return items.filter(i => new Date(i[dateField]) >= cutoff);
  };

  const stats = useMemo(() => {
    const fp = filterByTime(profiles);
    const fa = filterByTime(anonMembers);
    const fe = filterByTime(events);
    const fpo = filterByTime(posts);
    const fc = filterByTime(comments);
    const fr = filterByTime(reports);
    const fs = filterByTime(submissions);

    // Country distribution
    const countryMap = new Map<string, number>();
    [...fp, ...fa].forEach(i => {
      const c = i.country || 'Bilinmiyor';
      countryMap.set(c, (countryMap.get(c) || 0) + 1);
    });
    const countryData = Array.from(countryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    // Status distribution
    const statusMap = new Map<string, number>();
    [...fp, ...fa].forEach(i => {
      const s = i.status || 'active';
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    // Monthly growth
    const monthlyMap = new Map<string, { profiles: number; anon: number; events: number }>();
    const addToMonth = (items: any[], key: 'profiles' | 'anon' | 'events') => {
      items.forEach(i => {
        const d = new Date(i.created_at);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(m)) monthlyMap.set(m, { profiles: 0, anon: 0, events: 0 });
        monthlyMap.get(m)![key]++;
      });
    };
    addToMonth(fp, 'profiles');
    addToMonth(fa, 'anon');
    addToMonth(fe, 'events');
    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // Profession popularity
    const profMap = new Map<string, number>();
    [...profileProfs, ...anonProfs].forEach(pp => {
      const pid = pp.profession_id;
      profMap.set(pid, (profMap.get(pid) || 0) + 1);
    });
    const profData = Array.from(profMap.entries())
      .map(([id, count]) => {
        const prof = professions.find(p => p.id === id);
        return { name: prof?.name || 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Post/comment status
    const postStatusData = [
      { name: 'Onaylı', value: fpo.filter(p => p.status === 'approved').length },
      { name: 'Bekleyen', value: fpo.filter(p => p.status === 'pending').length },
      { name: 'Reddedilen', value: fpo.filter(p => p.status === 'rejected').length },
    ].filter(d => d.value > 0);

    // Report type distribution
    const reportTypeMap = new Map<string, number>();
    fr.forEach(r => {
      reportTypeMap.set(r.type, (reportTypeMap.get(r.type) || 0) + 1);
    });
    const reportTypeData = Array.from(reportTypeMap.entries()).map(([name, value]) => ({ name, value }));

    // Approval rate
    const approved = fp.filter(p => p.approved).length;
    const approvalRate = fp.length > 0 ? Math.round((approved / fp.length) * 100) : 0;

    return {
      totalMembers: fp.length + fa.length,
      totalProfiles: fp.length,
      totalAnon: fa.length,
      totalEvents: fe.length,
      totalPosts: fpo.length,
      totalComments: fc.length,
      totalReports: fr.length,
      totalSubmissions: fs.length,
      approvedProfiles: approved,
      approvalRate,
      countryData,
      statusData,
      monthlyData,
      profData,
      postStatusData,
      reportTypeData,
      uniqueCountries: countryMap.size,
    };
  }, [profiles, anonMembers, events, professions, posts, comments, reports, submissions, profileProfs, anonProfs, timeRange]);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      {/* Time filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Detaylı Raporlar</h3>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Zamanlar</SelectItem>
            <SelectItem value="30d">Son 30 Gün</SelectItem>
            <SelectItem value="90d">Son 90 Gün</SelectItem>
            <SelectItem value="1y">Son 1 Yıl</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard icon={Users} label="Toplam Üye" value={stats.totalMembers} color="text-primary" />
        <StatCard icon={Users} label="Profiller" value={stats.totalProfiles} color="text-primary" />
        <StatCard icon={Users} label="Anonim" value={stats.totalAnon} color="text-muted-foreground" />
        <StatCard icon={CalendarDays} label="Etkinlikler" value={stats.totalEvents} color="text-emerald-500" />
        <StatCard icon={FileText} label="Yazılar" value={stats.totalPosts} color="text-blue-500" />
        <StatCard icon={MessageSquare} label="Yorumlar" value={stats.totalComments} color="text-violet-500" />
        <StatCard icon={AlertTriangle} label="Raporlar" value={stats.totalReports} color="text-destructive" />
        <StatCard icon={Globe} label="Ülke Sayısı" value={stats.uniqueCountries} color="text-amber-500" />
      </div>

      {/* Approval Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Profil Onay Oranı</span>
              <Badge variant={stats.approvalRate > 70 ? 'default' : 'secondary'}>{stats.approvalRate}%</Badge>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stats.approvalRate}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.approvedProfiles} / {stats.totalProfiles} profil onaylı</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Başvuru Sayısı</span>
              <Badge variant="outline">{stats.totalSubmissions}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Toplam iletişim formu başvurusu</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Country Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> Ülkelere Göre Dağılım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.countryData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(152,60%,36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profession Popularity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> Popüler Meslekler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.profData} layout="vertical" margin={{ left: 120 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={115} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(200,60%,50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Growth */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> Aylık Büyüme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="profiles" stroke="hsl(152,60%,36%)" name="Profiller" strokeWidth={2} />
                  <Line type="monotone" dataKey="anon" stroke="#888" name="Anonim" strokeWidth={2} />
                  <Line type="monotone" dataKey="events" stroke="hsl(200,60%,50%)" name="Etkinlikler" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {stats.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Post Status */}
        {stats.postStatusData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" /> Yazı Durumları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.postStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label fontSize={11}>
                      {stats.postStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Types */}
        {stats.reportTypeData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-destructive" /> Rapor Türleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.reportTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label fontSize={11}>
                      {stats.reportTypeData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </CardContent>
  </Card>
);

export default DetailedReports;
