import { useEffect, useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { Table, SearchInput } from '../components/ui';
import { Activity, User, FileText, Shield, Scan as ScanIcon, Database } from 'lucide-react';
import type { AuditLog } from '../services/audit-logs';
import useSEO from '../hooks/useSEO';

const entityIcons: Record<string, any> = {
  user: User, article: FileText, role: Shield, scan: ScanIcon, knowledge: Database,
};

const AuditLogsPage = () => {
  useSEO({
    title: 'Audit Logs',
    description: 'Riwayat aktivitas sistem dan perubahan data secara real-time.',
    robots: 'noindex, nofollow',
  });

  const { logs, loading, pagination, getLogs } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      getLogs(1, pagination.limit, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.limit, getLogs]);

  const columns = [
    {
      key: 'action' as const,
      label: 'Aksi',
      render: (_: string, row: AuditLog) => {
        const Icon = entityIcons[row.entity] || Activity;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-bg text-app-text-secondary">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-app-text-primary text-sm">{row.action}</p>
              <p className="text-[10px] text-app-text-secondary uppercase font-black tracking-widest opacity-60">
                {row.entity} #{row.entity_id}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'details' as const,
      label: 'Detail',
      render: (val: string) => <span className="text-xs text-app-text-secondary font-medium truncate max-w-[300px] block">{val || '-'}</span>,
    },
    {
      key: 'user' as const,
      label: 'Pelaku',
      render: (_: any, row: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary-500/10 flex items-center justify-center text-[10px] font-black text-primary-600">
            {row.user?.first_name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-xs font-bold text-app-text-primary">
            {row.user ? `${row.user.first_name} ${row.user.last_name}` : row.user_id ? `User #${row.user_id}` : 'System'}
          </span>
        </div>
      ),
    },
    {
      key: 'ip_address' as const,
      label: 'IP Address',
      className: 'w-32',
      render: (val: string) => <span className="text-[10px] font-black text-app-text-secondary opacity-60 tabular-nums">{val || '-'}</span>,
    },
    {
      key: 'createdAt' as const,
      label: 'Waktu',
      render: (val: string) => (
        <span className="text-xs font-bold text-app-text-secondary tabular-nums">
          {new Date(val).toLocaleString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-app-text-primary tracking-tight">Audit Logs</h2>
        <p className="text-sm text-app-text-secondary font-medium">Riwayat aktivitas sistem dan perubahan data secara real-time.</p>
      </div>

      <div className="w-full sm:max-w-2xl">
        <SearchInput 
          placeholder="Cari aksi, detail, atau nama user..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <Table 
        data={logs} 
        columns={columns} 
        loading={loading} 
        showIndex 
        emptyMessage="Belum ada audit log yang tercatat" 
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          pageSize: pagination.limit,
          onPageChange: (page) => getLogs(page, pagination.limit, searchTerm),
          onPageSizeChange: (limit) => getLogs(1, limit, searchTerm)
        }}
      />
    </div>
  );
};

export default AuditLogsPage;
