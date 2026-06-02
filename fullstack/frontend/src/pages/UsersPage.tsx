import { useEffect, useState, useCallback } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import { Table, ActionButtonGroup, Modal, Input, FormSelect, SearchInput, Button } from '../components/ui';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getRoleBadgeColor, getStatusBadgeColor, formatRoleName } from '../utils/statusBadge';
import { UserPlus, Phone, Mail, Calendar, MapPin, User as UserIcon } from 'lucide-react';
import notificationService from '../services/notification';
import { toast } from 'sonner';
import type { User } from '../services/users';
import useSEO from '../hooks/useSEO';

// Modal for Adding/Editing Users
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const UserFormModal = ({ isOpen, onClose, mode, formData, onInputChange, onSubmit }: UserFormModalProps) => {
  const actions = (
    <div className="flex gap-3 w-full sm:w-auto">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-app-bg text-app-text-secondary font-bold hover:brightness-95 transition-all border border-app-border"
      >
        Batal
      </button>
      <button
        form="user-form"
        type="submit"
        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl green-gradient text-white font-bold shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
      >
        {mode === 'add' ? 'Tambah User' : 'Simpan Perubahan'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Tambah User Baru' : 'Edit Profil User'}
      actions={actions}
    >
      <form id="user-form" onSubmit={onSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Depan *"
            name="first_name"
            placeholder="John"
            value={formData.first_name}
            onChange={onInputChange}
            required
            className="rounded-xl"
          />
          <Input
            label="Nama Belakang *"
            name="last_name"
            placeholder="Doe"
            value={formData.last_name}
            onChange={onInputChange}
            required
            className="rounded-xl"
          />
        </div>

        <Input
          label="Email Address *"
          name="email"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={onInputChange}
          required
          disabled={mode === 'edit'}
          className="rounded-xl"
        />

        {mode === 'add' && (
          <Input
            label="Password *"
            name="password"
            type="password"
            placeholder="Min. 8 karakter"
            value={formData.password}
            onChange={onInputChange}
            required
            className="rounded-xl"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nomor Telepon"
            name="phone"
            placeholder="0812..."
            value={formData.phone}
            onChange={onInputChange}
            className="rounded-xl"
          />
          <FormSelect
            label="Jenis Kelamin"
            name="gender"
            value={formData.gender}
            onChange={onInputChange}
            options={[
              { value: 'male', label: 'Laki-laki' },
              { value: 'female', label: 'Perempuan' },
            ]}
            placeholder="Pilih Gender"
            className="rounded-xl"
          />
        </div>

        <Input
          label="Tanggal Lahir"
          name="birthdate"
          type="date"
          value={formData.birthdate ? formData.birthdate.split('T')[0] : ''}
          onChange={onInputChange}
          className="rounded-xl"
        />

        <Input
          label="Alamat Lengkap"
          name="address"
          placeholder="Jl. Raya No. 123..."
          value={formData.address}
          onChange={onInputChange}
          className="rounded-xl"
        />
      </form>
    </Modal>
  );
};

// Detail View Component
const UserDetailView = ({ user }: { user: User | null }) => {
  if (!user) return null;

  const roleColor = getRoleBadgeColor(user.role);
  const statusColor = getStatusBadgeColor(user.isActive);

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center gap-5 p-5 bg-app-bg rounded-2xl border border-app-border">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl green-gradient text-white font-black text-3xl premium-shadow">
          {user.first_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="text-2xl font-black text-app-text-primary tracking-tight">
            {user.first_name} {user.last_name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
             <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}>
              {formatRoleName(user.role)}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
              {user.isActive ? 'AKTIF' : 'NON-AKTIF'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg"><Mail size={18} /></div>
            <div>
              <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest leading-none">Email</p>
              <p className="text-sm font-bold text-app-text-primary mt-1">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${user.isEmailVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
              <Mail size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest leading-none">Email Status</p>
              <p className={`text-sm font-bold mt-1 ${user.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                {user.isEmailVerified ? '✓ Verified' : '⏳ Pending Verification'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg"><Phone size={18} /></div>
            <div>
              <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest leading-none">Telepon</p>
              <p className="text-sm font-bold text-app-text-primary mt-1">{user.phone || '-'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg"><UserIcon size={18} /></div>
            <div>
              <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest leading-none">Gender</p>
              <p className="text-sm font-bold text-app-text-primary mt-1 capitalize">{user.gender || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg"><Calendar size={18} /></div>
            <div>
              <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest leading-none">Tanggal Lahir</p>
              <p className="text-sm font-bold text-app-text-primary mt-1">{user.birthdate || '-'}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex items-start gap-3 p-4 bg-app-bg rounded-xl border border-dashed border-app-border">
          <div className="p-2 text-app-text-secondary"><MapPin size={18} /></div>
          <div>
            <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest leading-none">Alamat</p>
            <p className="text-sm font-bold text-app-text-primary mt-1 leading-relaxed">{user.address || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSend: (title: string, body: string) => Promise<void>;
}

const NotificationModal = ({ isOpen, onClose, user, onSend }: NotificationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ title: '', body: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title || !data.body) return;
    
    try {
      setLoading(true);
      await onSend(data.title, data.body);
      setData({ title: '', body: '' });
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const actions = (
    <div className="flex gap-3 w-full sm:w-auto">
      <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-app-bg text-app-text-secondary font-bold border border-app-border">Batal</button>
      <Button onClick={handleSubmit} disabled={loading} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl green-gradient text-white font-bold">
        {loading ? 'Mengirim...' : 'Kirim Sekarang'}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Kirim Notifikasi ke ${user?.first_name}`} actions={actions}>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <Input label="Judul Notifikasi" value={data.title} onChange={e => setData(d => ({...d, title: e.target.value}))} placeholder="Halo!" required />
        <div>
          <label className="block text-sm font-bold text-app-text-primary mb-2">Isi Pesan</label>
          <textarea 
            value={data.body} 
            onChange={e => setData(d => ({...d, body: e.target.value}))} 
            className="w-full p-4 bg-app-bg border border-app-border rounded-xl min-h-[100px] text-app-text-primary outline-none focus:ring-2 focus:ring-primary-500/20" 
            placeholder="Tulis pesan Anda..." 
            required 
          />
        </div>
      </form>
    </Modal>
  );
};

const UsersPage = () => {
  useSEO({
    title: 'Kelola Users',
    description: 'Kelola data pengguna platform Freshly.',
    robots: 'noindex, nofollow',
  });

  const { users, loading, pagination, getUsers, deleteUser, createUser, updateUser, promote, demote } = useUsers();
  const { user: currentUser } = useAuth();
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'promote' | 'demote'; user: User } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleSendNotification = async (title: string, body: string) => {
    if (!selectedUser) return;
    try {
      await notificationService.sendToUser({
        userId: selectedUser.id,
        title,
        body
      });
      toast.success(`Notifikasi terkirim ke ${selectedUser.first_name}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim notifikasi');
      throw error;
    }
  };
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    address: '',
    birthdate: ''
  });

  const refreshUsers = useCallback((page = pagination.page, limit = pagination.limit, search = searchTerm) => {
    getUsers(page, limit, search);
  }, [getUsers, pagination.page, pagination.limit, searchTerm]);

  // Initial load & search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      getUsers(1, pagination.limit, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.limit, getUsers]);

  const handleAddUser = () => {
    setModalMode('add');
    setFormData({ first_name: '', last_name: '', email: '', password: '', phone: '', gender: '', address: '', birthdate: '' });
    setShowFormModal(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      gender: user.gender || '',
      address: user.address || '',
      birthdate: user.birthdate || ''
    });
    setShowFormModal(true);
  };

  const handlePromote = (user: User) => {
    setConfirmAction({ type: 'promote', user });
  };

  const handleDemote = (user: User) => {
    setConfirmAction({ type: 'demote', user });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      setConfirmLoading(true);
      if (confirmAction.type === 'promote') {
        await promote(confirmAction.user.id);
      } else {
        await demote(confirmAction.user.id);
      }
      refreshUsers();
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await createUser(formData);
      } else if (selectedUser) {
        // Edit: drop password / email (backend rejects them on update) and
        // strip empty strings so optional fields don't wipe stored values.
        const { password, email, ...editable } = formData;
        const payload = Object.fromEntries(
          Object.entries(editable).filter(([, value]) => value !== ''),
        );
        await updateUser(selectedUser.id, payload);
      }
      setShowFormModal(false);
      refreshUsers();
    } catch (err) {}
  };

  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const columns = [
    {
      key: 'first_name' as const,
      label: 'Nama',
      render: (_: string, row: any) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 font-black text-xs">
            {row.first_name?.[0]?.toUpperCase()}
          </div>
          <span className="font-bold text-app-text-primary truncate">
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    {
      key: 'email' as const,
      label: 'Email',
      render: (val: string) => <span className="text-app-text-secondary font-medium truncate max-w-[200px] block">{val}</span>,
    },
    {
      key: 'isEmailVerified' as const,
      label: 'Email Verified',
      className: 'w-32',
      render: (val: boolean) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
          val 
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
            : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${val ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {val ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'role' as const,
      label: 'Role',
      render: (_: any, row: any) => {
        const roleColor = getRoleBadgeColor(row.role);
        return (
          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}>
            {formatRoleName(row.role)}
          </span>
        );
      },
    },
    {
      key: 'isActive' as const,
      label: 'Status',
      className: 'w-24',
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
      key: 'actions' as const,
      label: 'Aksi',
      className: 'w-10',
      render: (_: number, row: any) => (
        <ActionButtonGroup
          onView={() => { setSelectedUser(row); setShowDetailModal(true); }}
          onEdit={() => handleEdit(row)}
          onDelete={async () => {
            await deleteUser(row.id);
            refreshUsers();
          }}
          onPromote={() => handlePromote(row)}
          onDemote={() => handleDemote(row)}
          onNotify={() => { setSelectedUser(row); setShowNotificationModal(true); }}
          showView={true}
          showEdit={canManageUsers}
          showDelete={canManageUsers}
          showPromote={isSuperAdmin && row.role === 'user'}
          showDemote={isSuperAdmin && row.role === 'admin'}
          showNotify={canManageUsers}
          size="sm"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <NotificationModal 
        isOpen={showNotificationModal} 
        onClose={() => setShowNotificationModal(false)}
        user={selectedUser}
        onSend={handleSendNotification}
      />

      {/* Search & Small Add Action */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput 
          placeholder="Cari user..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
        
        {canManageUsers && (
          <button 
            onClick={handleAddUser}
            className="flex items-center justify-center gap-2 green-gradient text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:brightness-105 active:scale-95 transition-all sm:shrink-0 sm:w-auto w-full"
          >
            <UserPlus size={14} />
            <span className="sm:inline">Add User</span>
          </button>
        )}
      </div>

      {/* Table Section */}
      <Table
        data={users}
        columns={columns}
        loading={loading}
        showIndex={true}
        emptyMessage="Tidak ada data"
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          pageSize: pagination.limit,
          onPageChange: (page) => getUsers(page, pagination.limit, searchTerm),
          onPageSizeChange: (limit) => getUsers(1, limit, searchTerm)
        }}
      />

      {/* Modals */}
      <Modal 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
        title="Detail Profil"
        actions={<button onClick={() => setShowDetailModal(false)} className="px-5 py-2 rounded-lg bg-app-bg text-app-text-secondary font-bold text-sm border border-app-border">Tutup</button>}
      >
        <UserDetailView user={selectedUser} />
      </Modal>
      
      <UserFormModal 
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        mode={modalMode}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        isLoading={confirmLoading}
        variant={confirmAction?.type === 'promote' ? 'info' : 'warning'}
        title={confirmAction?.type === 'promote' ? 'Promosikan User' : 'Turunkan User'}
        message={confirmAction?.type === 'promote'
          ? `Promosikan ${confirmAction?.user?.first_name} menjadi Admin?`
          : `Turunkan ${confirmAction?.user?.first_name} menjadi User Biasa?`
        }
        confirmText={confirmAction?.type === 'promote' ? 'Ya, Promosikan' : 'Ya, Turunkan'}
      />
    </div>
  );
};

export default UsersPage;
