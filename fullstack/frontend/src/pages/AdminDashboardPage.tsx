import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStats } from '../hooks/useStats';
import api from '../api/axios';
import {
  Users, Scan, BookOpen, MessageSquare, Database,
  ShieldCheck, Brain, FileText, Activity, ArrowRight
} from 'lucide-react';
import { AnimateGrow } from '../components/ui/Transitions';
import { Skeleton, SkeletonList } from '../components/ui/PageLoader';
import useSEO from '../hooks/useSEO';

const AdminDashboardPage = () => {
  useSEO({
    title: 'Admin Dashboard',
    description: 'Ringkasan aktivitas dan statistik platform Freshly.',
    robots: 'noindex, nofollow',
  });

  const { stats, loading } = useStats();
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const response = await api.get('/audit-logs?page=1&limit=5&sortBy=createdAt&sortOrder=desc');
        setRecentActivities(response.data.data.logs || []);
      } catch (error) {
        // Silent — activities widget is non-critical
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchRecentActivities();
  }, []);

  const getActivityIcon = (action: string) => {
    if (action.includes('register') || action.includes('user')) return Users;
    if (action.includes('article')) return BookOpen;
    if (action.includes('scan')) return Scan;
    if (action.includes('knowledge')) return Brain;
    if (action.includes('role')) return ShieldCheck;
    return Activity;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('register') || action.includes('user')) return 'text-blue-600 bg-blue-500/10';
    if (action.includes('article')) return 'text-violet-600 bg-violet-500/10';
    if (action.includes('scan')) return 'text-emerald-600 bg-emerald-500/10';
    if (action.includes('knowledge')) return 'text-amber-600 bg-amber-500/10';
    if (action.includes('role')) return 'text-rose-600 bg-rose-500/10';
    return 'text-gray-600 bg-gray-500/10';
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  const statCards = [
    { label: 'Total Pengguna', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Scans', value: stats?.totalScans || 0, icon: Scan, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Artikel Terbit', value: stats?.totalArticles || 0, icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Percakapan AI', value: stats?.totalConversations || 0, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Knowledge Base', value: stats?.totalKnowledges || 0, icon: Database, color: 'text-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  const quickActions = [
    { label: 'Kelola Users', path: '/admin/users', icon: Users, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Kelola Roles', path: '/admin/roles', icon: ShieldCheck, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Tulis Artikel', path: '/admin/articles', icon: FileText, color: 'bg-violet-500/10 text-violet-600' },
    { label: 'Knowledge Base', path: '/admin/knowledge', icon: Brain, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, color: 'bg-rose-500/10 text-rose-600' },
  ];

  return (
    <div className="space-y-6 pb-12 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-app-text-primary tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-app-text-secondary mt-1">Ringkasan aktivitas dan statistik platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-5">
        {statCards.map((stat, index) => (
          <AnimateGrow key={stat.label} show={true} timeout={100 + index * 50}>
            <div className={`group relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
              <div className="flex justify-between items-start mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-app-surface shadow-sm ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest opacity-80">{stat.label}</p>
              {loading ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <h3 className="text-2xl font-black text-app-text-primary mt-1 tracking-tight">
                  {stat.value.toLocaleString()}
                </h3>
              )}
              <stat.icon className={`absolute -right-4 -bottom-4 h-20 w-24 ${stat.color} opacity-[0.03] rotate-12`} />
            </div>
          </AnimateGrow>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-app-text-primary mb-4">Aksi Cepat</h3>
          <div className="space-y-2">
            {quickActions.map(action => (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-app-bg transition-all group"
              >
                <div className={`p-2 rounded-lg ${action.color}`}><action.icon className="w-4 h-4" /></div>
                <span className="text-sm font-medium text-app-text-primary flex-1">{action.label}</span>
                <ArrowRight className="w-4 h-4 text-app-text-secondary/30 group-hover:text-app-text-secondary group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-app-surface border border-app-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-app-text-primary">Aktivitas Terbaru</h3>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-primary-600 hover:text-primary-700">Lihat Semua</Link>
          </div>
          <div className="space-y-3">
            {loadingActivities ? (
              <SkeletonList rows={5} />
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8 text-sm text-app-text-secondary">Belum ada aktivitas</div>
            ) : (
              recentActivities.map((item: any) => {
                const Icon = getActivityIcon(item.action);
                const color = getActivityColor(item.action);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-app-bg/50 transition-all">
                    <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app-text-primary capitalize">{item.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-app-text-secondary truncate">{item.details || item.entity}</p>
                    </div>
                    <span className="text-[10px] text-app-text-secondary/60 shrink-0">{formatTimeAgo(item.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
