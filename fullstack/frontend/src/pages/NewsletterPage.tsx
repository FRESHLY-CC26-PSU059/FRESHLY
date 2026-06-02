import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';
import { 
  Mail, Send, Users, Loader2, RefreshCw, 
  CheckCircle, AlertCircle, Clock 
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import useSEO from '../hooks/useSEO';

interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

const NewsletterPage = () => {
  useSEO({
    title: 'Newsletter',
    description: 'Kirim newsletter ke semua subscriber aktif platform Freshly.',
    robots: 'noindex, nofollow',
  });

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/newsletter');
      setSubscribers(res.data.data?.subscribers || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject dan konten wajib diisi');
      return;
    }
    if (subscribers.length === 0) {
      toast.error('Tidak ada subscriber aktif');
      return;
    }

    try {
      setSending(true);
      setSendResult(null);
      const res = await api.post('/newsletter/send', { subject, content });
      const data = res.data.data;
      setSendResult(data);
      toast.success(res.data.message);
      setSubject('');
      setContent('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim newsletter');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6 pt-4 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-app-text-primary tracking-tight">Newsletter</h1>
        <p className="text-sm text-app-text-secondary mt-1">Kirim newsletter ke semua subscriber aktif</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl"><Send size={20} /></div>
              <div>
                <h3 className="text-sm font-black text-app-text-primary uppercase tracking-tight">Tulis Newsletter</h3>
                <p className="text-xs font-medium text-app-text-secondary mt-0.5">Compose dan kirim ke {subscribers.length} subscriber</p>
              </div>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-app-text-primary mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Judul newsletter..."
                  className="w-full px-4 py-3 rounded-xl border border-app-border bg-app-bg text-app-text-primary text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all placeholder:text-app-text-secondary/40"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-app-text-primary mb-1.5">Konten</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Tulis konten newsletter... (mendukung HTML)"
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl border border-app-border bg-app-bg text-app-text-primary text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all resize-none placeholder:text-app-text-secondary/40"
                  required
                />
                <p className="text-[10px] text-app-text-secondary mt-1.5 px-1">Mendukung format HTML untuk styling email</p>
              </div>

              {sendResult && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${sendResult.failed > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                  {sendResult.failed > 0 ? (
                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-app-text-primary">
                      Terkirim ke {sendResult.sent}/{sendResult.total} subscriber
                    </p>
                    {sendResult.failed > 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">{sendResult.failed} gagal terkirim</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={sending || subscribers.length === 0}
                  className="green-gradient text-white shadow-lg shadow-emerald-500/20 px-6"
                >
                  {sending ? (
                    <><Loader2 size={14} className="mr-2 animate-spin" /> Mengirim...</>
                  ) : (
                    <><Send size={14} className="mr-2" /> Kirim Newsletter</>
                  )}
                </Button>
                <span className="text-xs text-app-text-secondary">
                  {subscribers.length} subscriber aktif
                </span>
              </div>
            </form>
          </Card>
        </div>

        {/* Subscriber List */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl"><Users size={16} /></div>
                <h3 className="text-sm font-black text-app-text-primary uppercase tracking-tight">Subscriber</h3>
              </div>
              <button
                onClick={fetchSubscribers}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-app-bg text-app-text-secondary transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-3xl font-black text-primary-600">{subscribers.length}</p>
              <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">Total Aktif</p>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-app-border">
              {loading ? (
                <div className="py-8 text-center"><Loader2 size={18} className="animate-spin text-app-text-secondary mx-auto" /></div>
              ) : subscribers.length === 0 ? (
                <div className="py-8 text-center">
                  <Mail size={24} className="text-app-text-secondary/20 mx-auto mb-2" />
                  <p className="text-xs text-app-text-secondary">Belum ada subscriber</p>
                </div>
              ) : subscribers.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 py-2.5">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <Mail size={12} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-app-text-primary truncate">{sub.email}</p>
                    <p className="text-[10px] text-app-text-secondary flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPage;
