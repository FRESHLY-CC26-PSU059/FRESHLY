import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Table, Modal, ConfirmDialog, AuthenticatedImage } from '../components/ui';
import { Camera, Upload, Scan, Trash2, Eye, X, BookOpen, Lightbulb, Library, ArrowRight, RotateCw, ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import { FRUIT_OPTIONS, DEFAULT_FRUIT_ID } from '../constants/fruits';
import logger from '../utils/logger';
import useSEO from '../hooks/useSEO';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
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

interface ScanItem {
  id: number;
  image_url: string;
  object_name: string;
  object_type: string;
  ripeness_level: string;
  is_consumable: boolean;
  confidence: number;
  recommendation: string;
  createdAt: string;
  raw_response?: {
    fruit_type: string;
    predicted_class: string;
    confidence: number;
    all_probabilities: Record<string, number>;
  };
}

// ── Scan Upload/Camera Panel ──
const ScanPanel = ({ onScanComplete }: { onScanComplete: () => void }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/admin') ? '/admin' : '/user';
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [streamVersion, setStreamVersion] = useState(0);
  const [fruitType, setFruitType] = useState<string>(DEFAULT_FRUIT_ID);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [mode, streamVersion]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async (fMode: 'user' | 'environment' = facingMode) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Browser tidak mendukung akses kamera atau koneksi tidak aman');
      return;
    }

    try {
      // Try requested facingMode first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: fMode }, 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
        });
      } catch {
        // Fallback: if requested facingMode fails (e.g. no rear camera on laptop), try any camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      }
      streamRef.current = stream;
      setStreamVersion(v => v + 1);
      setFacingMode(fMode);
      setMode('camera');
      setResult(null);
    } catch (err: any) {
      logger.error('Camera error', { error: err?.message, name: err?.name });
      const msg = err.name === 'NotAllowedError' 
        ? 'Izin kamera ditolak. Silakan aktifkan di pengaturan browser.'
        : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
        ? 'Tidak ditemukan kamera pada perangkat ini. Gunakan fitur Upload.'
        : 'Gagal mengakses kamera. Pastikan kamera tidak sedang digunakan aplikasi lain.';
      toast.error(msg);
      setMode('idle');
    }
  };

  const toggleCamera = async () => {
    stopCamera();
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(newMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        setFile(capturedFile);
        setPreview(URL.createObjectURL(blob));
        setMode('preview');
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const analyzeScan = async (fileToAnalyze?: File) => {
    const targetFile = fileToAnalyze || file;
    if (!targetFile) return;
    try {
      setAnalyzing(true);
      const fd = new FormData();
      fd.append('image', targetFile);
      fd.append('fruit_type', fruitType);
      const res = await api.post('/scans/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data.data.scan);
      toast.success('Analisis selesai');
      onScanComplete();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menganalisis gambar');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Hanya file gambar yang diperbolehkan'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMode('preview');
    setResult(null);
    analyzeScan(f);
  };

  const resetScan = () => {
    stopCamera(); setMode('idle'); setPreview(null); setFile(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-app-surface border border-app-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
      {mode === 'idle' && !result && (
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-500/10 text-primary-600 mb-6 shadow-inner">
              <Scan className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-app-text-primary tracking-tight">{t('scan.title')}</h2>
            <p className="text-sm text-app-text-secondary mt-2 max-w-xs mx-auto">Gunakan teknologi AI tercanggih untuk mendeteksi tingkat kesegaran buah Anda.</p>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <p className="text-[10px] font-black text-app-text-secondary uppercase tracking-[0.2em]">{t('scan.labels.speciesTarget')}</p>
              <div className="h-px flex-1 bg-app-border mx-4" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {FRUIT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFruitType(opt.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 transform active:scale-95 ${
                    fruitType === opt.id
                      ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10 scale-105'
                      : 'border-app-border hover:border-primary-500/30 bg-app-bg'
                  }`}
                >
                  <span className="text-2xl mb-2 drop-shadow-sm">{opt.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${fruitType === opt.id ? 'text-primary-600' : 'text-app-text-secondary'}`}>
                    {t(`scan.species.${opt.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <button onClick={() => startCamera()} className="flex items-center justify-center gap-4 p-5 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95">
              <Camera className="w-6 h-6" /> Kamera
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-4 p-5 rounded-2xl bg-white border-2 border-primary-600 text-primary-600 font-black uppercase tracking-widest hover:bg-primary-50 transition-all active:scale-95">
              <Upload className="w-6 h-6" /> Upload
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {mode === 'camera' && (
        <div className="relative group">
          <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-4/3 object-cover bg-black" />
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 backdrop-blur-[1px]">
            <div className="h-full w-full border-2 border-white/30 rounded-xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 -mt-1 -ml-1" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 -mt-1 -mr-1" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 -mb-1 -ml-1" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 -mb-1 -mr-1" />
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-8 flex items-center justify-center gap-6 bg-linear-to-t from-black/80 to-transparent">
            <button onClick={resetScan} className="p-4 rounded-full bg-white/10 text-white backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors"><X className="w-6 h-6" /></button>
            <button onClick={capturePhoto} className="p-6 rounded-full bg-white text-primary-600 shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-90 transition-all"><Camera className="w-8 h-8" /></button>
            <button onClick={toggleCamera} className="p-4 rounded-full bg-white/10 text-white backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors"><RotateCw className="w-6 h-6" /></button>
          </div>
        </div>
      )}

      {mode === 'preview' && preview && !result && (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full aspect-4/3 object-cover bg-black" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            {analyzing && (
              <div className="text-center space-y-4">
                <div className="relative h-20 w-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
                  <Scan className="absolute inset-0 m-auto w-8 h-8 text-primary-500 animate-pulse" />
                </div>
                <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">{t('scan.labels.processing')}</p>
              </div>
            )}
          </div>
          {!analyzing && (
            <div className="absolute bottom-0 inset-x-0 p-8 flex items-center justify-center gap-4 bg-linear-to-t from-black/80 to-transparent">
              <button onClick={resetScan} className="px-8 py-3 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest backdrop-blur-xl border border-white/20 hover:bg-white/20">Ulangi</button>
              <button onClick={() => analyzeScan()} className="px-10 py-3 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest shadow-lg shadow-primary-600/40 hover:bg-primary-700">Analisis</button>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="bg-app-surface text-app-text-primary">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-app-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${result.is_consumable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-app-text-primary">{t('scan.labels.verdict')}</h3>
                <p className="text-xs text-app-text-secondary">#{result.id.toString().padStart(6, '0')} &middot; {new Date(result.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to={`${routePrefix}/conversations?scanId=${result.id}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 text-center"
              >
                <MessageSquare className="w-4 h-4" /> Tanya AI
              </Link>
              <button 
                onClick={resetScan} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <RotateCw className="w-4 h-4" /> {t('scan.labels.reset')}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Image + quick info */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-app-border bg-black shadow-xl">
                  <img src={preview || result.image_url} alt="Scan Result" className="h-full w-full object-contain" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-app-bg border border-app-border text-center">
                    <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1">{t('scan.labels.object')}</p>
                    <p className="text-base font-bold capitalize">{t(`scan.species.${result.object_name}`, result.object_name)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-app-bg border border-app-border text-center">
                    <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1">{t('scan.labels.status')}</p>
                    <p className={`text-base font-bold ${result.is_consumable ? 'text-emerald-600' : 'text-red-600'}`}>
                      {result.is_consumable ? t('scan.status.safe') : t('scan.status.risky')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Analytics */}
              <div className="lg:col-span-7 space-y-4">
                {/* Confidence gauge */}
                <div className="p-6 rounded-2xl bg-app-bg border border-app-border">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative h-28 w-28 flex-shrink-0">
                      <svg className="h-full w-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" className="stroke-app-border" strokeWidth="8" />
                        <circle 
                          cx="50" cy="50" r="45" fill="none" 
                          className={`transition-all duration-1000 ease-out ${result.confidence > 0.8 ? 'stroke-emerald-500' : result.confidence > 0.5 ? 'stroke-amber-500' : 'stroke-red-500'}`}
                          strokeWidth="8" 
                          strokeDasharray={`${result.confidence * 282.6} 282.6`} 
                          strokeLinecap="round" 
                          transform="rotate(-90 50 50)" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">{(result.confidence * 100).toFixed(0)}%</span>
                        <span className="text-[8px] font-bold text-app-text-secondary uppercase">{t('scan.labels.accuracy')}</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-xs font-bold text-app-text-secondary uppercase tracking-wider mb-1">{t('scan.labels.freshnessVerdict')}</p>
                      <h4 className="text-2xl font-bold text-app-text-primary capitalize mb-2">{t(`scan.ripeness.${result.ripeness_level}`, result.ripeness_level)}</h4>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-app-surface border border-app-border">
                        <div className={`h-2 w-2 rounded-full animate-pulse ${result.is_consumable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-medium text-app-text-secondary">{t('scan.labels.confirmed')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Probability bars */}
                {result.raw_response?.all_probabilities && (
                  <div className="p-6 rounded-2xl bg-app-bg border border-app-border">
                    <p className="text-xs font-bold text-app-text-secondary uppercase tracking-wider mb-4">{t('scan.labels.distribution')}</p>
                    <div className="space-y-4">
                      {Object.entries(result.raw_response.all_probabilities)
                        .sort(([, a], [, b]) => b - a)
                        .map(([label, prob], idx) => {
                          const levelKey = label.split('_').pop() || '';
                          const isPrimary = label.includes(result.ripeness_level);
                          return (
                            <div key={label}>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className={`text-xs font-medium capitalize ${isPrimary ? 'text-primary-600 font-bold' : 'text-app-text-secondary'}`}>
                                  {t(`scan.ripeness.${levelKey}`, { defaultValue: levelKey })}
                                </span>
                                <span className={`text-xs font-bold tabular-nums ${isPrimary ? 'text-primary-600' : 'text-app-text-primary'}`}>
                                  {Number(prob).toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-app-surface border border-app-border rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                    isPrimary ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-app-text-secondary/20'
                                  }`} 
                                  style={{ width: `${Math.max(prob, 0.5)}%`, transitionDelay: `${idx * 100}ms` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 h-28 w-28 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-200" />
                  <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{t('scan.labels.summary')}</p>
                </div>
                <p className="text-sm leading-relaxed text-white/90 whitespace-pre-line">
                  {result.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Discovery Section ──
const DiscoverySection = ({ routePrefix }: { routePrefix: string }) => (
  <div>
    <h3 className="text-xs font-black text-app-text-secondary uppercase tracking-widest mb-4 px-1">Jelajahi Lebih Lanjut</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Link to="/ensiklopedia" className="group bg-app-surface border border-app-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><Library className="w-5 h-5" /></div>
          <h4 className="text-sm font-bold text-app-text-primary">Ensiklopedia Buah</h4>
        </div>
        <p className="text-xs text-app-text-secondary leading-relaxed">Pelajari ciri kesegaran, nutrisi, dan cara penyimpanan beragam jenis buah.</p>
        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-primary-600 group-hover:gap-2 transition-all">
          Jelajahi <ArrowRight className="w-3 h-3" />
        </div>
      </Link>
      <Link to={`${routePrefix}/conversations`} className="group bg-app-surface border border-app-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl"><Lightbulb className="w-5 h-5" /></div>
          <h4 className="text-sm font-bold text-app-text-primary">Tanya Asisten AI</h4>
        </div>
        <p className="text-xs text-app-text-secondary leading-relaxed">Konsultasikan pertanyaan seputar buah, nutrisi, dan penyimpanan.</p>
        <div className="flex items-center gap-1 mt-3 text-xs font-bold text-primary-600 group-hover:gap-2 transition-all">
          Mulai Chat <ArrowRight className="w-3 h-3" />
        </div>
      </Link>
      <div className="bg-app-surface border border-app-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl"><BookOpen className="w-5 h-5" /></div>
          <h4 className="text-sm font-bold text-app-text-primary">Tips Harian</h4>
        </div>
        <p className="text-xs text-app-text-secondary leading-relaxed">Buah yang disimpan di suhu ruang matang lebih cepat. Masukkan ke kulkas untuk memperlambat proses.</p>
        <p className="text-[10px] text-app-text-secondary/50 mt-3 uppercase tracking-wider font-bold">Tips Hari Ini</p>
      </div>
    </div>
  </div>
);

// ── Main Page ──
const ScansPage = () => {
  useSEO({
    title: 'Riwayat Scan',
    description: 'Lihat riwayat dan hasil analisis deteksi kematangan buah Anda di Freshly.',
    robots: 'noindex, nofollow',
  });

  const { t } = useTranslation();
  const location = useLocation();
  const routePrefix = useMemo(() => (location.pathname.startsWith('/admin') ? '/admin' : '/user'), [location.pathname]);
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/scans', {
        params: { page, limit }
      });
      setScans(res.data.data || []);
      if (res.data.pagination) {
        setTotalItems(res.data.pagination.totalItems);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat riwayat scan');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/scans/${id}`);
      fetchScans();
      toast.success('Scan berhasil dihapus');
    } catch { toast.error('Gagal menghapus scan'); }
    finally { setDeleteId(null); }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/scans/clear-all');
      setScans([]);
      setPage(1);
      toast.success('Seluruh riwayat scan berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus seluruh riwayat scan');
    } finally {
      setShowClearConfirm(false);
    }
  };

  const columns = [
    {
      key: 'image_url' as const, label: 'Gambar',
      render: (val: string) => {
        const resolvedSrc = resolveImageSrc(val);
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-bg border border-app-border overflow-hidden shadow-sm">
            {resolvedSrc ? (
              <AuthenticatedImage src={resolvedSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <Scan className="w-5 h-5 text-app-text-secondary opacity-30" />
            )}
          </div>
        );
      },
    },
    {
      key: 'object_name' as const, label: t('scan.labels.object'),
      render: (val: string) => <p className="font-bold text-app-text-primary capitalize">{t(`scan.species.${val}`, val)}</p>,
    },
    {
      key: 'ripeness_level' as const, label: 'Kematangan',
      render: (val: string) => <span className="text-xs font-bold text-app-text-primary capitalize">{t(`scan.ripeness.${val}`, val)}</span>,
    },
    {
      key: 'is_consumable' as const, label: 'Kelayakan',
      render: (val: boolean) => <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${val ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>{val ? t('scan.status.consumable') : t('scan.status.notConsumable')}</span>,
    },
    {
      key: 'confidence' as const, label: 'Confidence',
      render: (val: number) => <span className="text-sm font-bold text-app-text-primary tabular-nums">{val ? `${(val * 100).toFixed(0)}%` : '-'}</span>,
    },
    {
      key: 'createdAt' as const, label: 'Tanggal',
      render: (val: string) => <span className="text-xs font-bold text-app-text-secondary">{new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>,
    },
    {
      key: 'actions' as const, label: '', className: 'w-10',
      render: (_: any, row: ScanItem) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setSelectedScan(row); setShowDetail(true); }} className="p-1.5 w-7 h-7 inline-flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Eye className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(row.id)} className="p-1.5 w-7 h-7 inline-flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pt-4">
      <ScanPanel onScanComplete={fetchScans} />
      <DiscoverySection routePrefix={routePrefix} />
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-app-text-secondary uppercase tracking-widest">{t('scan.labels.history')}</h3>
          {scans.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-[10px] font-black text-red-600 uppercase tracking-widest hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Hapus Semua
            </button>
          )}
        </div>
        <Table 
            data={scans} 
            columns={columns} 
            loading={loading} 
            showIndex 
            emptyMessage="Belum ada riwayat scan" 
            pagination={{
              currentPage: page,
              totalPages,
              totalItems,
              pageSize: limit,
              onPageChange: setPage,
              onPageSizeChange: (s) => { setLimit(s); setPage(1); }
            }}
          />
      </div>
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Scan">
        {selectedScan && (
          <div className="space-y-4 py-2">
            {selectedScan.image_url && (
              <div className="rounded-xl overflow-hidden border border-app-border bg-black">
                <AuthenticatedImage src={resolveImageSrc(selectedScan.image_url) || ''} alt="Scan" className="w-full max-h-56 object-contain" />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-app-bg rounded-xl text-center">
                <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">{t('scan.labels.object')}</p>
                <p className="text-sm font-bold text-app-text-primary mt-1 capitalize">{t(`scan.species.${selectedScan.object_name}`, selectedScan.object_name)}</p>
              </div>
              <div className="p-3 bg-app-bg rounded-xl text-center">
                <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">{t('scan.labels.freshnessVerdict')}</p>
                <p className="text-sm font-bold text-app-text-primary mt-1 capitalize">{t(`scan.ripeness.${selectedScan.ripeness_level}`, selectedScan.ripeness_level)}</p>
              </div>
              <div className="p-3 bg-app-bg rounded-xl text-center">
                <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">{t('scan.labels.accuracy')}</p>
                <p className="text-sm font-bold text-app-text-primary mt-1">{selectedScan.confidence ? `${(selectedScan.confidence * 100).toFixed(1)}%` : '-'}</p>
              </div>
            </div>
            <div className={`p-3 rounded-xl text-center border ${selectedScan.is_consumable ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <span className={`text-sm font-bold ${selectedScan.is_consumable ? 'text-emerald-600' : 'text-red-600'}`}>
                {selectedScan.is_consumable ? '✓ Layak Konsumsi' : '✗ Tidak Layak Konsumsi'}
              </span>
            </div>
            {selectedScan.recommendation && (
              <div className="p-4 bg-primary-500/5 border border-primary-500/10 rounded-xl">
                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-2">{t('scan.labels.recommendation')}</p>
                <p className="text-sm text-app-text-primary leading-relaxed whitespace-pre-line">{selectedScan.recommendation}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Link
                to={`${routePrefix}/conversations?scanId=${selectedScan.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Tanya AI tentang Scan Ini
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Hapus Scan"
        message="Yakin ingin menghapus hasil scan ini? Data tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Hapus Semua Riwayat"
        message="Yakin ingin menghapus SELURUH riwayat scan Anda? Tindakan ini permanen."
        confirmText="Hapus Semua"
        cancelText="Batal"
      />
    </div>
  );
};

export default ScansPage;
