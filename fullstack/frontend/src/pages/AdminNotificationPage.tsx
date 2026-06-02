import { useState, useEffect } from 'react';
import { Send, Megaphone, Info, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Input, Button } from '../components/ui';
import notificationService, { type User } from '../services/notification';
import { toast } from 'sonner';
import useSEO from '../hooks/useSEO';

const AdminNotificationPage = () => {
  useSEO({
    title: 'Pusat Notifikasi',
    description: 'Kirim pengumuman atau notifikasi personal ke pengguna.',
    robots: 'noindex, nofollow',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [tab, setTab] = useState<'broadcast' | 'individual'>('broadcast');
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'broadcast'
  });

  // Fetch all users when individual tab is clicked
  useEffect(() => {
    if (tab === 'individual' && users.length === 0) {
      fetchAllUsers();
    }
  }, [tab]);

  const fetchAllUsers = async () => {
    try {
      setFetchingUsers(true);
      const result = await notificationService.getAllUsers(100, 1);
      
      // Handle different API response structures
      let usersData = [];
      if (Array.isArray(result?.data)) {
        usersData = result.data;
      } else if (Array.isArray(result?.data?.users)) {
        usersData = result.data.users;
      } else if (Array.isArray(result?.users)) {
        usersData = result.users;
      } else if (Array.isArray(result)) {
        usersData = result;
      }
      
      setUsers(usersData);
    } catch (error) {
      toast.error('Gagal memuat data users');
      setUsers([]);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    if (query.trim() && users.length > 0) {
      setShowUserDropdown(true);
    } else {
      setShowUserDropdown(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUserSearchQuery(user.first_name);
    setShowUserDropdown(false);
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.last_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const handleSubmitBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.error('Judul dan pesan harus diisi');
      return;
    }

    try {
      setLoading(true);
      
      const result = await notificationService.sendBroadcast({
        title: formData.title,
        body: formData.body,
        type: formData.type
      });
      
      const sentCount = result?.data?.sent || 0;
      toast.success(`✅ Berhasil mengirim broadcast ke ${sentCount} user!`);
      setFormData({ title: '', body: '', type: 'broadcast' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengirim broadcast';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.error('Judul dan pesan harus diisi');
      return;
    }
    if (!selectedUser) {
      toast.error('Pilih user terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      
      await notificationService.sendToUser({
        userId: selectedUser.id,
        title: formData.title,
        body: formData.body,
        type: formData.type
      });
      
      toast.success(`✅ Berhasil mengirim notifikasi ke ${selectedUser.first_name}!`);
      setFormData({ title: '', body: '', type: 'broadcast' });
      setSelectedUser(null);
      setUserSearchQuery('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengirim notifikasi';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-app-text-primary tracking-tight">Pusat Notifikasi</h1>
          <p className="text-app-text-secondary font-medium">Kirim pengumuman atau notifikasi personal ke pengguna.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-app-border">
        <button
          onClick={() => setTab('broadcast')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            tab === 'broadcast'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-app-text-secondary hover:text-app-text-primary'
          }`}
        >
          <Megaphone className="inline mr-2" size={16} />
          Broadcast ke Semua
        </button>
        <button
          onClick={() => setTab('individual')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            tab === 'individual'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-app-text-secondary hover:text-app-text-primary'
          }`}
        >
          <Users className="inline mr-2" size={16} />
          Kirim ke Per Orang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-app-surface border border-app-border rounded-3xl p-6 premium-shadow">
            {/* BROADCAST TAB */}
            {tab === 'broadcast' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-app-text-primary">Kirim Broadcast</h2>
                    <p className="text-xs text-app-text-secondary font-medium">Notifikasi ini akan muncul di ponsel semua user.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitBroadcast} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                      Judul Notifikasi
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Contoh: Pemeliharaan Sistem atau Fitur Baru!"
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                      Isi Pesan
                    </label>
                    <textarea
                      name="body"
                      value={formData.body}
                      onChange={handleInputChange}
                      placeholder="Tulis detail pengumuman Anda di sini..."
                      required
                      className="w-full min-h-[120px] p-4 bg-app-bg border border-app-border rounded-xl text-app-text-primary placeholder:text-app-text-secondary focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                      Tipe Notifikasi
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-app-bg border border-app-border rounded-xl text-app-text-primary focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    >
                      <option value="broadcast">Pengumuman (Default)</option>
                      <option value="info">Informasi</option>
                      <option value="warning">Peringatan</option>
                      <option value="promo">Promo / Fitur</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 green-gradient text-white rounded-xl font-black text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:scale-[1.01] transition-all"
                    >
                      {loading ? (
                        <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={20} />
                          Kirim ke Semua User
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* INDIVIDUAL TAB */}
            {tab === 'individual' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-app-text-primary">Kirim ke Per Orang</h2>
                    <p className="text-xs text-app-text-secondary font-medium">Kirim notifikasi personal ke user tertentu. {users.length > 0 && <span className="text-primary-500 font-bold">({users.length} user tersedia)</span>}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitIndividual} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                      Pilih User
                    </label>
                    <div className="relative">
                      {fetchingUsers ? (
                        <div className="p-4 text-center text-app-text-secondary text-sm font-medium">
                          ⏳ Memuat data users...
                        </div>
                      ) : (
                        <>
                          <Input
                            value={userSearchQuery}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            placeholder="Cari nama atau email user..."
                            className="rounded-xl"
                          />
                          {showUserDropdown && filteredUsers.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-app-surface border border-app-border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                              {filteredUsers.map(user => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => handleSelectUser(user)}
                                  className="w-full text-left px-4 py-3 hover:bg-app-bg transition-all border-b border-app-border/30 last:border-0"
                                >
                                  <p className="text-sm font-bold text-app-text-primary">{user.first_name} {user.last_name}</p>
                                  <p className="text-xs text-app-text-secondary">{user.email}</p>
                                </button>
                              ))}
                            </div>
                          )}
                          {selectedUser && (
                            <div className="mt-3 p-3 bg-primary-500/10 rounded-xl border border-primary-500/20">
                              <p className="text-sm font-bold text-primary-600">{selectedUser.first_name} {selectedUser.last_name}</p>
                              <p className="text-xs text-primary-600/70">{selectedUser.email}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                      Judul Notifikasi
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Contoh: Promo Spesial untuk Anda!"
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                      Isi Pesan
                    </label>
                    <textarea
                      name="body"
                      value={formData.body}
                      onChange={handleInputChange}
                      placeholder="Tulis pesan personal Anda di sini..."
                      required
                      className="w-full min-h-[120px] p-4 bg-app-bg border border-app-border rounded-xl text-app-text-primary placeholder:text-app-text-secondary focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-app-text-primary mb-2 ml-1">
                      Tipe Notifikasi
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-app-bg border border-app-border rounded-xl text-app-text-primary focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                    >
                      <option value="broadcast">Pesan Personal</option>
                      <option value="promo">Promo</option>
                      <option value="info">Informasi</option>
                      <option value="warning">Peringatan</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading || !selectedUser}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-black text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={20} />
                          Kirim Notifikasi
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-app-surface border border-app-border rounded-3xl p-6 premium-shadow">
            <h3 className="font-bold text-app-text-primary mb-4">Tips Menulis Notifikasi</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-1 flex-shrink-0 text-emerald-500">
                  <CheckCircle size={16} />
                </div>
                <p className="text-xs text-app-text-secondary font-medium leading-relaxed">
                  Gunakan judul yang menarik (Clickworthy) tapi tidak menyesatkan.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 flex-shrink-0 text-emerald-500">
                  <CheckCircle size={16} />
                </div>
                <p className="text-xs text-app-text-secondary font-medium leading-relaxed">
                  Pesan sebaiknya singkat dan padat (kurang dari 150 karakter).
                </p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 flex-shrink-0 text-amber-500">
                  <AlertTriangle size={16} />
                </div>
                <p className="text-xs text-app-text-secondary font-medium leading-relaxed">
                  Hindari mengirim terlalu sering agar user tidak mematikan notifikasi.
                </p>
              </li>
            </ul>
          </div>

          <div className="bg-primary-500/5 border border-primary-500/10 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Info size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Informasi Teknis</span>
            </div>
            <p className="text-[10px] text-app-text-secondary font-bold leading-normal">
              Sistem menggunakan Firebase Cloud Messaging (FCM). Notifikasi akan diterima secara real-time jika user sedang online atau memiliki Service Worker yang aktif di background.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationPage;
