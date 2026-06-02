import { useEffect, useState } from 'react';
import { useRoles } from '../hooks/useRoles';
import { Table, ActionButtonGroup, Modal, Input, SearchInput } from '../components/ui';
import { getStatusBadgeColor } from '../utils/statusBadge';
import { Plus } from 'lucide-react';
import type { Role } from '../services/roles';
import useSEO from '../hooks/useSEO';

const RolesPage = () => {
  useSEO({
    title: 'Kelola Roles',
    description: 'Kelola role akses pengguna di platform Freshly.',
    robots: 'noindex, nofollow',
  });

  const { roles, loading, pagination, getRoles, createRole, updateRole, deleteRole } = useRoles();
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ role_name: '', enabled: true });
  const [searchTerm, setSearchTerm] = useState('');

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      getRoles(1, pagination.limit, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.limit, getRoles]);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setFormData({ role_name: role.role_name, enabled: role.enabled });
    } else {
      setSelectedRole(null);
      setFormData({ role_name: '', enabled: true });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, formData);
      } else {
        await createRole(formData);
      }
      setShowModal(false);
    } catch (error) {}
  };

  const columns = [
    {
      key: 'role_name' as const,
      label: 'Nama Role',
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-bg text-app-text-secondary font-black text-xs">
            {value?.[0]?.toUpperCase()}
          </div>
          <span className="font-bold text-app-text-primary uppercase tracking-tight">{value}</span>
        </div>
      ),
    },
    {
      key: 'enabled' as const,
      label: 'Status',
      render: (val: boolean) => {
        const statusColor = getStatusBadgeColor(val);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot}`} />
            {val ? 'Aktif' : 'Off'}
          </span>
        );
      },
    },
    {
      key: 'createdAt' as const,
      label: 'Tanggal Dibuat',
      render: (val: string) => (
        <span className="text-xs font-bold text-app-text-secondary">
          {new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions' as const,
      label: 'Aksi',
      className: 'w-10',
      render: (_: any, row: Role) => (
        <ActionButtonGroup
          onEdit={() => handleOpenModal(row)}
          onDelete={async () => {
            await deleteRole(row.id);
          }}
          showEdit={true}
          showDelete={true}
          size="sm"
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput 
          placeholder="Cari role..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 green-gradient text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:brightness-105 active:scale-95 transition-all sm:shrink-0 sm:w-auto w-full"
        >
          <Plus size={16} />
          <span className="sm:inline">Add Role</span>
        </button>
      </div>

      {/* Table Section */}
      <Table
        data={roles}
        columns={columns}
        loading={loading}
        showIndex={true}
        emptyMessage="Tidak ada data role"
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          pageSize: pagination.limit,
          onPageChange: (page) => getRoles(page, pagination.limit, searchTerm),
          onPageSizeChange: (limit) => getRoles(1, limit, searchTerm)
        }}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedRole ? 'Edit Role' : 'Tambah Role Baru'}
        actions={
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowModal(false)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-app-bg text-app-text-secondary font-bold text-sm hover:brightness-95 transition-all border border-app-border"
            >
              Batal
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl green-gradient text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-105 transition-all"
            >
              {selectedRole ? 'Simpan' : 'Buat Role'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          <Input
            label="Nama Role"
            value={formData.role_name}
            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            placeholder="Misal: EDITOR, VIEWER"
            required
            className="rounded-xl"
          />

          <div className="flex items-center gap-3 p-4 rounded-xl bg-app-bg border border-app-border">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-5 w-5 rounded border-app-border text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="enabled" className="text-sm font-bold text-app-text-primary cursor-pointer">
              Aktifkan Role
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RolesPage;
