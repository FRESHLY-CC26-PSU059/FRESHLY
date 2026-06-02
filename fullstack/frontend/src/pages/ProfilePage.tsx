import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { Card, Input, Button, FormSelect } from '../components/ui';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera, Users, LogIn } from 'lucide-react';
import { TestimonialList } from '../components/TestimonialList';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';

const ProfilePage = () => {
  useSEO({
    title: 'Profil Saya',
    description: 'Kelola informasi profil pribadi dan detail akun Anda di Freshly.',
    robots: 'noindex, nofollow',
  });

  const { user, updateUserProfile } = useAuth();
  const location = useLocation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    address: '',
    birthdate: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        address: user.address || '',
        birthdate: user.birthdate ? user.birthdate.split('T')[0] : '',
      });
    }
  }, [user]);
  
  useEffect(() => {
    if (location.hash === '#testimoni-saya') {
      setTimeout(() => {
        const element = document.getElementById('testimoni-saya');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Upload to server
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const updatedUser = response.data.data.user;
      updateUserProfile(updatedUser);
      toast.success('Foto profil berhasil diperbarui');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto profil');
      setAvatarPreview(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.patch('/users/me', form);
      const updatedUser = response.data.data.user;
      updateUserProfile(updatedUser);
      toast.success('Profil berhasil diperbarui');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  // Uploads live at /uploads on the backend origin, not under /api/v1.
  const API_ORIGIN = (() => {
    try {
      return new URL(API_URL).origin;
    } catch {
      return API_URL.replace(/\/api\/v\d+\/?$/, '');
    }
  })();
  const resolveImageSrc = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  const avatarSrc = avatarPreview || resolveImageSrc(user?.imgUrl);

  const formatLastLogin = (dateStr?: string) => {
    if (!dateStr) return 'Belum pernah login';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '-';
    }
  };

  const InfoRow = ({ icon: Icon, label, value, color }: { icon: any; label: string; value?: string; color: string }) => (
    <div className="flex items-start gap-4 p-1">
      <div className={`p-2.5 ${color} rounded-xl shrink-0`}><Icon size={18} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-widest opacity-60">{label}</p>
        <p className="text-sm font-bold text-app-text-primary mt-0.5 break-words">{value || '-'}</p>
      </div>
    </div>
  );

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-app-text-primary tracking-tight">Profil Saya</h2>
          <p className="text-sm text-app-text-secondary mt-1 font-medium">Kelola informasi pribadi dan foto profil Anda.</p>
        </div>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)} className="md:w-auto">
            Edit Profil
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <div className="h-32 w-32 rounded-3xl overflow-hidden premium-shadow ring-4 ring-app-bg">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center green-gradient text-white font-black text-4xl">
                    {user?.first_name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -right-2 -bottom-2 p-2.5 bg-white text-primary-600 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border border-app-border"
              >
                <Camera size={18} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            
            <h3 className="text-lg font-black text-app-text-primary">{user?.first_name} {user?.last_name}</h3>
            <p className="text-xs font-bold text-app-text-secondary opacity-70 mb-4">{user?.email}</p>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 text-[10px] font-black uppercase tracking-widest">
              {user?.role}
            </div>
          </Card>
        </div>

        {/* Right Column: Details/Edit Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            {!editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <InfoRow icon={User} label="Nama Depan" value={user?.first_name} color="bg-primary-500/10 text-primary-600" />
                <InfoRow icon={User} label="Nama Belakang" value={user?.last_name} color="bg-primary-500/10 text-primary-600" />
                <InfoRow icon={Mail} label="Alamat Email" value={user?.email} color="bg-emerald-500/10 text-emerald-600" />
                <InfoRow icon={Phone} label="Nomor Telepon" value={user?.phone} color="bg-blue-500/10 text-blue-600" />
                <InfoRow icon={Users} label="Jenis Kelamin" value={user?.gender === 'male' ? 'Laki-laki' : user?.gender === 'female' ? 'Perempuan' : '-'} color="bg-violet-500/10 text-violet-600" />
                <InfoRow icon={Calendar} label="Tanggal Lahir" value={user?.birthdate} color="bg-rose-500/10 text-rose-600" />
                <InfoRow icon={LogIn} label="Login Terakhir" value={formatLastLogin(user?.lastLogin)} color="bg-slate-500/10 text-slate-600" />
                <div className="sm:col-span-2">
                  <InfoRow icon={MapPin} label="Alamat Lengkap" value={user?.address} color="bg-amber-500/10 text-amber-600" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nama Depan" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required placeholder="Masukkan nama depan" />
                  <Input label="Nama Belakang" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required placeholder="Masukkan nama belakang" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect 
                    label="Jenis Kelamin" 
                    value={form.gender} 
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    options={[
                      { value: 'male', label: 'Laki-laki' },
                      { value: 'female', label: 'Perempuan' },
                    ]}
                    placeholder="Pilih jenis kelamin"
                  />
                  <Input label="Nomor Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812..." />
                </div>
 
                <Input label="Tanggal Lahir" type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
                <Input label="Alamat Lengkap" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jl. Raya No. 123..." />
                
                <div className="flex items-center gap-3 pt-4">
                  <Button type="submit" isLoading={saving} className="flex-1 sm:flex-none">
                    <Save size={14} className="mr-2" /> Simpan Perubahan
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={saving} className="flex-1 sm:flex-none">
                    Batal
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
 
      {/* Testimonial Section */}
      {!isAdmin && (
        <Card id="testimoni-saya" className="p-6">
          <TestimonialList />
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
