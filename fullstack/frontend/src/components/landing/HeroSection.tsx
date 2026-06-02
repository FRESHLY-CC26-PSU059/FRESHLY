import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import pisangMentahImg from '../../assets/images/fruits/pisang_mentah.png';
import manggaImg from '../../assets/images/fruits/mangga.png';
import jerukImg from '../../assets/images/fruits/jeruk.png';
import cabaiImg from '../../assets/images/fruits/cabai.png';
import paprikaImg from '../../assets/images/fruits/paprika.png';
import tomatImg from '../../assets/images/fruits/tomat.png';

interface HeroSectionProps {
  uniqueVarieties?: number;
  isAuthenticated: boolean;
}

const fruitMockups = [
  {
    object_name: 'banana',
    display_name: 'Pisang Cavendish',
    image: pisangMentahImg,
    ripeness_level: 'Mentah',
    is_consumable: false,
    confidence: 0.9999,
    recommendation: 'Pisang terdeteksi mentah (unripe). Tekstur keras, rasa kelat/sepat. Simpan di suhu ruang selama 2-4 hari bersama apel untuk mempercepat kematangan.',
    all_probabilities: {
      ripe: 0.0,
      unripe: 99.99,
      rotten: 0.01
    }
  },
  {
    object_name: 'mango',
    display_name: 'Mangga Harum Manis',
    image: manggaImg,
    ripeness_level: 'Matang',
    is_consumable: true,
    confidence: 0.9654,
    recommendation: 'Mangga terdeteksi matang sempurna (ripe). Tekstur empuk lembut, manis optimal. Sangat layak dikonsumsi langsung atau diolah.',
    all_probabilities: {
      ripe: 96.54,
      unripe: 3.2,
      rotten: 0.26
    }
  },
  {
    object_name: 'orange',
    display_name: 'Jeruk Pontianak',
    image: jerukImg,
    ripeness_level: 'Matang',
    is_consumable: true,
    confidence: 0.9421,
    recommendation: 'Jeruk terdeteksi segar layak konsumsi (ripe). Kulit mulus kekuningan, kadar air tinggi, rasa manis segar kaya vitamin C.',
    all_probabilities: {
      ripe: 94.21,
      unripe: 4.8,
      rotten: 0.99
    }
  },
  {
    object_name: 'chili',
    display_name: 'Cabai Rawit',
    image: cabaiImg,
    ripeness_level: 'Matang',
    is_consumable: true,
    confidence: 0.9876,
    recommendation: 'Cabai terdeteksi merah matang sempurna (ripe). Tekstur kencang renyah, pedas maksimal. Layak konsumsi untuk bumbu/sambal.',
    all_probabilities: {
      ripe: 98.76,
      unripe: 1.0,
      rotten: 0.24
    }
  },
  {
    object_name: 'paprika',
    display_name: 'Paprika Hijau',
    image: paprikaImg,
    ripeness_level: 'Matang',
    is_consumable: true,
    confidence: 0.9543,
    recommendation: 'Paprika terdeteksi segar matang (ripe). Kulit kencang mengkilap, batang segar. Layak dikonsumsi langsung atau untuk masakan.',
    all_probabilities: {
      ripe: 95.43,
      unripe: 3.5,
      rotten: 1.07
    }
  },
  {
    object_name: 'tomato',
    display_name: 'Tomat Merah',
    image: tomatImg,
    ripeness_level: 'Matang',
    is_consumable: true,
    confidence: 0.9712,
    recommendation: 'Tomat terdeteksi matang merah (ripe). Kulit kencang mulus, tekstur agak empuk padat. Siap konsumsi segar atau diolah.',
    all_probabilities: {
      ripe: 97.12,
      unripe: 2.1,
      rotten: 0.78
    }
  }
];

const HeroSection = ({ uniqueVarieties, isAuthenticated }: HeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % fruitMockups.length);
        setFade(true);
      }, 300);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const activeMockup = fruitMockups[currentSlide];

  return (
    <section className="relative overflow-hidden min-h-[92vh] flex items-center bg-gradient-to-br from-[#020f09] via-[#0a1810] to-[#051410]">
      {/* Premium mesh gradient orbs */}
      <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/25 blur-[140px] animate-pulse-glow" />
      <div className="absolute right-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-teal-400/15 blur-[160px]" />
      <div className="absolute bottom-[-5%] left-1/3 h-[400px] w-[400px] rounded-full bg-lime-400/12 blur-[120px] animate-pulse-glow" />
      <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-emerald-400/8 blur-[100px]" />

      {/* Premium grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pt-28 pb-24 sm:pt-32 sm:pb-28 md:grid-cols-2 md:px-8 md:pt-28 md:pb-24 relative">
        {/* Left: Copy */}
        <div className="text-white flex flex-col justify-center order-2 md:order-1">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full glass-card px-4 py-2.5 text-[11px] font-semibold tracking-[0.15em] text-emerald-300 w-fit border border-emerald-500/20 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            TEKNOLOGI AI TERDEPAN
          </div>

          <h1 className="animate-fade-up-1 mt-6 text-[clamp(2.2rem,5vw,4.2rem)] leading-[1.08] font-extrabold tracking-tight text-balance">
            Satu Foto.<br />
            <span className="bg-gradient-to-r from-emerald-300 via-green-300 to-lime-300 bg-clip-text text-transparent drop-shadow-lg">
              Langsung Tahu Layaknya.
            </span>
          </h1>

          <p className="animate-fade-up-2 mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-white/70 font-light">
            AI menganalisis <span className="font-semibold text-white">warna, tekstur & tanda kerusakan</span> untuk menentukan kematangan dan kelayakan konsumsi dalam hitungan detik.
          </p>

          {/* Trust badges */}
          <div className="animate-fade-up-3 mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full glass-card px-4 py-2 text-[11px] font-semibold text-emerald-200 border border-emerald-500/20 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Akurasi 94%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full glass-card px-4 py-2 text-[11px] font-semibold text-lime-200 border border-lime-500/20 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-lime-400" />
              &lt;2 detik
            </span>
            {uniqueVarieties != null && uniqueVarieties > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full glass-card px-4 py-2 text-[11px] font-semibold text-emerald-200 border border-emerald-500/20 backdrop-blur-sm">
                <span className="text-sm">🍌🥭🍊🌶️🫑🍅</span>
                <span>{uniqueVarieties} jenis</span>
              </span>
            )}
          </div>

          <div className="animate-fade-up-4 mt-10 flex flex-wrap gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/50 hover:translate-y-[-3px] hover:scale-105 active:scale-95"
                >
                  <ScanLine className="w-4.5 h-4.5 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                  Mulai Scan Sekarang
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-2xl glass-card px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15 border border-white/20 hover:border-white/40 hover:translate-y-[-2px]"
                >
                  Buka Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/50 hover:translate-y-[-3px] hover:scale-105 active:scale-95"
                >
                  <ScanLine className="w-4.5 h-4.5 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                  Mulai Scan Gratis
                </Link>
                <Link
                  to="/login"
                  className="rounded-2xl glass-card px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15 border border-white/20 hover:border-white/40 hover:translate-y-[-2px]"
                >
                  Masuk ke Akun
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right: Phone Mockup */}
        <div className="flex justify-center md:justify-end order-1 md:order-2 items-center">
          <div className="animate-float relative">
            {/* Premium dual-color glow behind phone */}
            <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-br from-emerald-500/30 via-teal-400/20 to-lime-300/20 blur-3xl scale-110" />
            <div className="absolute -inset-0.5 rounded-[3rem] bg-gradient-to-tr from-emerald-400/10 to-transparent blur-2xl" />
            
            <div className="relative h-[440px] w-[220px] sm:h-[500px] sm:w-[250px] rounded-[2.8rem] border-2 border-white/30 bg-[#0a0a0a] p-2 shadow-2xl shadow-emerald-900/50 ring-1 ring-white/10 overflow-hidden">
              {/* Notch */}
              <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-black/90 border border-white/10 backdrop-blur-sm z-[20]" />
              
              {/* Screen content with smooth transition */}
              <div className={`h-full rounded-[2.3rem] bg-gradient-to-b from-white via-zinc-50 to-zinc-100 overflow-hidden shadow-inner flex flex-col transition-all duration-300 ${
                fade ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                {/* Full-bleed Image Header */}
                <div className="relative h-44 sm:h-52 w-full shrink-0">
                  <img
                    src={activeMockup.image}
                    alt={`${activeMockup.display_name} - ${activeMockup.ripeness_level}`}
                    className="h-full w-full object-cover"
                  />
                  {/* Status bar overlay */}
                  <div className="absolute top-0 inset-x-0 flex items-center justify-between px-6 pt-5 pb-8 bg-gradient-to-b from-black/50 to-transparent">
                    <span className="text-[8px] font-bold text-white tracking-widest">FRESHLY</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-white/80" />
                      <div className="w-1 h-1 rounded-full bg-white/80" />
                      <div className="w-1 h-1 rounded-full bg-white/40" />
                    </div>
                  </div>
                  {/* Label overlay */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider text-white shadow-lg ${
                      activeMockup.is_consumable ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                    }`}>
                      {activeMockup.is_consumable ? '✓ Layak' : '✗ Risky'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-zinc-900">{activeMockup.display_name}</h3>
                    <p className={`text-[9px] font-bold ${activeMockup.is_consumable ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {activeMockup.is_consumable ? 'Layak konsumsi' : 'Perlu perhatian'} · Akurasi {(activeMockup.confidence * 100).toFixed(2)}%
                    </p>
                  </div>

                  {/* Dynamic Probability bars matching API response structure */}
                  <div className="mt-3 space-y-2 text-[10px] bg-zinc-50 rounded-xl p-3 border border-zinc-200/50">
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-700 font-bold">
                        <span className="flex items-center gap-1">🟢 Matang</span>
                        <span>{activeMockup.all_probabilities.ripe.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{width: `${activeMockup.all_probabilities.ripe}%`}} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-700 font-bold text-opacity-60">
                        <span className="flex items-center gap-1">🟡 Mentah</span>
                        <span>{activeMockup.all_probabilities.unripe.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{width: `${activeMockup.all_probabilities.unripe}%`}} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-700 font-bold text-opacity-60">
                        <span className="flex items-center gap-1">🔴 Busuk</span>
                        <span>{activeMockup.all_probabilities.rotten.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500" style={{width: `${activeMockup.all_probabilities.rotten}%`}} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
