import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import pisangImg from '../../assets/images/fruits/pisang.png';
import manggaImg from '../../assets/images/fruits/mangga.png';
import jerukImg from '../../assets/images/fruits/jeruk.png';

interface FruitInfo {
  name: string;
  scientificName: string;
  description: string;
  freshness: string;
  storage: string;
  benefits: string;
  image: string;
}

const fruits: FruitInfo[] = [
  {
    name: 'Pisang Cavendish',
    scientificName: 'Musa acuminata',
    description: 'Jenis pisang paling populer di dunia dengan tekstur krim dan rasa manis sedang.',
    freshness: 'Cari yang berwarna kuning cerah dengan bintik cokelat kecil - tanda layak konsumsi optimal.',
    storage: 'Simpan di suhu ruang. Masukkan ke kulkas jika ingin memperlambat penurunan kesegaran.',
    benefits: 'Kaya akan kalium dan vitamin B6 untuk energi instan.',
    image: pisangImg,
  },
  {
    name: 'Mangga Harum Manis',
    scientificName: 'Mangifera indica',
    description: 'Mangga lokal unggulan dengan aroma harum khas dan rasa manis yang pekat.',
    freshness: 'Cari yang pangkal buahnya harum dan sedikit lunak saat ditekan lembut - tanda kematangan optimal.',
    storage: 'Simpan di suhu ruang sampai matang, lalu masukkan ke kulkas untuk menjaga kesegaran.',
    benefits: 'Kaya akan serat pangan, vitamin A, dan vitamin C.',
    image: manggaImg,
  },
  {
    name: 'Jeruk Pontianak',
    scientificName: 'Citrus reticulata',
    description: 'Jeruk lokal dengan rasa manis segar dan kadar air yang tinggi.',
    freshness: 'Cari yang kulitnya mulus dan agak lunak saat ditekan - tanda kesegaran optimal.',
    storage: 'Tahan lama di suhu ruang atau kulkas.',
    benefits: 'Sumber Vitamin C alami yang sangat tinggi.',
    image: jerukImg,
  },
];

const FruitEncyclopedia = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {fruits.map((fruit) => (
          <article key={fruit.name} className="flex flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface transition-all hover:shadow-md">
            <div className="flex h-48 items-center justify-center bg-app-bg p-6">
              <img src={fruit.image} alt={fruit.name} className="h-full object-contain" />
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-app-text-primary">{fruit.name}</h3>
                <p className="text-xs italic text-app-text-secondary">{fruit.scientificName}</p>
              </div>
              
              <p className="mb-4 text-sm text-app-text-secondary leading-relaxed">
                {fruit.description}
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-app-accent">Ciri Layak Konsumsi</h4>
                  <p className="text-xs text-app-text-secondary">{fruit.freshness}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-app-accent">Penyimpanan</h4>
                  <p className="text-xs text-app-text-secondary">{fruit.storage}</p>
                </div>
              </div>
              
              <div className="mt-6 border-t border-app-border pt-4">
                <p className="text-[10px] font-medium text-app-text-secondary">
                  <span className="font-bold text-app-accent">Manfaat:</span> {fruit.benefits}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Lihat Semua Button */}
      <div className="flex justify-center pt-4">
        <Link 
          to="/ensiklopedia" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 active:scale-95"
        >
          Lihat Semua Ensiklopedia
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default FruitEncyclopedia;
