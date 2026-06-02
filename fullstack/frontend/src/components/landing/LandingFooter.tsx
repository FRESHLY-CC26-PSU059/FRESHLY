import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import LegalModal from '../ui/LegalModal';
import { LogoMark } from '../ui/Logo';
import { BRAND, COPYRIGHT } from '../../constants/brand';
import api from '../../api/axios';

const LandingFooter = () => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'tos' | null>(null);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const contactEmails = (import.meta.env.VITE_CONTACT_EMAIL || 'support@freshly.app')
    .split(',')
    .map((email: string) => email.trim())
    .filter(Boolean);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid');
      return;
    }
    try {
      setSubscribing(true);
      await api.post('/newsletter/subscribe', { email });
      toast.success('Berhasil berlangganan newsletter!');
      setEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal berlangganan');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <footer className="bg-[linear-gradient(180deg,#022f1b_0%,#012315_100%)] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={32} />
              <p className="text-2xl font-extrabold tracking-tight">{BRAND.nameUpper}<span className="text-lime-300">.</span></p>
            </div>
            <p className="mt-4 text-sm leading-7 text-emerald-200/90">
              {BRAND.pitch}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-lime-300/90">
              {BRAND.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Navigasi</h3>
            <ul className="mt-4 space-y-2 text-sm text-emerald-200/90">
              <li><a href="/#fitur" className="transition hover:text-white">Fitur</a></li>
              <li><a href="/#cara-kerja" className="transition hover:text-white">Cara Kerja</a></li>
              <li><Link to="/ensiklopedia" className="transition hover:text-white">Ensiklopedia</Link></li>
              <li><a href="/#testimoni" className="transition hover:text-white">Testimoni</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Hubungi Kami</h3>
            <ul className="mt-4 space-y-2 text-sm text-emerald-200/90">
              {contactEmails.map((email: string) => (
                <li key={email} className="flex items-center gap-2">
                  <Mail size={16} className="text-lime-300 animate-pulse shrink-0" />
                  <a href={`mailto:${email}`} className="transition hover:text-white break-all">
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Dapatkan Update</h3>
            <p className="mt-4 text-sm text-emerald-200/90">Berlangganan tips memilih buah segar langsung ke emailmu.</p>
            <div className="mt-4 flex rounded-xl bg-white/10 p-1">
              <input
                type="email"
                placeholder="Alamat Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-emerald-100/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 shrink-0 disabled:opacity-60"
              >
                {subscribing ? '...' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-900/80">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-emerald-200/70 md:flex-row md:items-center md:justify-between md:px-8">
            <p>{COPYRIGHT}</p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setLegalModal('privacy')} className="hover:text-white transition-colors">Kebijakan Privasi</button>
              <button type="button" onClick={() => setLegalModal('tos')} className="hover:text-white transition-colors">Syarat & Ketentuan</button>
            </div>
          </div>
        </div>
      </footer>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </>
  );
};

export default LandingFooter;
