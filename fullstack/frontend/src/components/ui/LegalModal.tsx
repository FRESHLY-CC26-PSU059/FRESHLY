import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'tos' | null;
  onClose: () => void;
}

const PRIVACY_CONTENT = {
  title: 'Kebijakan Privasi',
  sections: [
    {
      heading: '1. Data yang Kami Kumpulkan',
      body: 'Saat Anda menggunakan FRESHLY, kami mengumpulkan: (a) data registrasi seperti nama dan alamat email; (b) foto buah yang Anda upload atau ambil melalui kamera untuk dianalisis oleh model AI kami; (c) hasil analisis scan termasuk jenis buah, tingkat kesegaran, dan rekomendasi kelayakan; (d) riwayat percakapan dengan asisten AI; serta (e) data teknis seperti jenis perangkat, browser, dan waktu akses untuk keperluan keamanan dan peningkatan layanan.',
    },
    {
      heading: '2. Bagaimana Kami Menggunakan Data Anda',
      body: 'Data yang dikumpulkan digunakan untuk: menyediakan layanan analisis kualitas buah secara real-time; meningkatkan akurasi model AI melalui pembelajaran dari data scan anonim; menyimpan riwayat scan agar Anda dapat mengaksesnya kembali; mengirimkan informasi penting terkait layanan dan pembaruan fitur. Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.',
    },
    {
      heading: '3. Penyimpanan Foto & Hasil Scan',
      body: 'Foto buah yang Anda upload disimpan di server kami untuk menghasilkan analisis dan ditampilkan di riwayat scan Anda. Foto dapat dihapus kapan saja melalui fitur hapus di halaman riwayat scan. Data hasil analisis (tanpa foto) dapat disimpan dalam bentuk anonim untuk keperluan peningkatan model AI.',
    },
    {
      heading: '4. Keamanan Data',
      body: 'Kami menerapkan standar keamanan industri: password di-hash menggunakan bcrypt; komunikasi dienkripsi melalui HTTPS; akses API dilindungi oleh token autentikasi (JWT) dan client key; serta rate limiting untuk mencegah penyalahgunaan.',
    },
    {
      heading: '5. Hak Anda',
      body: 'Anda berhak untuk: mengakses seluruh data pribadi yang kami simpan; memperbarui informasi profil kapan saja; menghapus akun dan seluruh data terkait; serta menarik persetujuan penggunaan data. Untuk menggunakan hak-hak ini, hubungi kami melalui email di support@freshly.id.',
    },
    {
      heading: '6. Cookie & Penyimpanan Lokal',
      body: 'Kami menggunakan localStorage browser untuk menyimpan preferensi tema (gelap/terang), status sidebar, dan token sesi login. Tidak ada cookie pelacakan pihak ketiga yang digunakan di platform ini.',
    },
    {
      heading: '7. Perubahan Kebijakan',
      body: 'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan material akan diberitahukan melalui notifikasi dalam aplikasi. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap kebijakan yang diperbarui.',
    },
  ],
};

const TOS_CONTENT = {
  title: 'Syarat & Ketentuan',
  sections: [
    {
      heading: '1. Penerimaan Syarat',
      body: 'Dengan membuat akun atau menggunakan layanan FRESHLY, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, harap tidak menggunakan layanan kami.',
    },
    {
      heading: '2. Deskripsi Layanan',
      body: 'FRESHLY adalah platform analisis kualitas buah berbasis kecerdasan buatan (AI). Layanan meliputi: analisis foto buah melalui upload atau kamera langsung; laporan kelayakan konsumsi dengan tingkat kepercayaan (confidence); ensiklopedia buah dengan informasi nutrisi dan penyimpanan; asisten AI untuk konsultasi terkait buah; serta riwayat scan yang tersimpan otomatis.',
    },
    {
      heading: '3. Akun Pengguna',
      body: 'Anda bertanggung jawab penuh atas keamanan kredensial akun Anda. Setiap aktivitas yang terjadi melalui akun Anda dianggap sebagai tindakan Anda. Segera laporkan jika Anda mencurigai adanya akses tidak sah ke akun Anda.',
    },
    {
      heading: '4. Penggunaan yang Diperbolehkan',
      body: 'Anda setuju untuk menggunakan FRESHLY hanya untuk tujuan yang sah dan sesuai dengan ketentuan ini. Dilarang: mengunggah konten yang melanggar hukum atau hak pihak lain; mencoba mengakses sistem secara tidak sah; menggunakan bot atau scraper untuk mengakses layanan secara otomatis; serta menyalahgunakan API atau fitur layanan.',
    },
    {
      heading: '5. Batasan Tanggung Jawab',
      body: 'Hasil analisis AI bersifat estimasi dan TIDAK menggantikan penilaian profesional di bidang keamanan pangan. FRESHLY tidak bertanggung jawab atas keputusan konsumsi yang diambil berdasarkan hasil analisis. Selalu gunakan penilaian pribadi dan konsultasikan dengan ahli jika ragu terhadap kondisi buah.',
    },
    {
      heading: '6. Hak Kekayaan Intelektual',
      body: 'Seluruh konten, desain, kode, model AI, dan materi lain di platform FRESHLY adalah milik kami atau pemberi lisensi kami dan dilindungi oleh hukum hak cipta Indonesia dan internasional.',
    },
    {
      heading: '7. Penghentian Layanan',
      body: 'Kami berhak menangguhkan atau menghentikan akses Anda jika terjadi pelanggaran terhadap ketentuan ini. Kami juga berhak mengubah, menangguhkan, atau menghentikan fitur layanan kapan saja dengan pemberitahuan yang wajar.',
    },
    {
      heading: '8. Hukum yang Berlaku',
      body: 'Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia. Segala sengketa yang timbul akan diselesaikan secara musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan yang berwenang di Indonesia.',
    },
  ],
};

export default function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  const content = type === 'privacy' ? PRIVACY_CONTENT : TOS_CONTENT;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-app-surface border border-app-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-app-border p-5 sm:p-6 shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-app-text-primary">{content.title}</h2>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 hide-scrollbar">
            <p className="text-xs text-app-text-secondary">Terakhir diperbarui: 25 April 2026</p>
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="text-sm font-bold text-app-text-primary mb-1.5">{section.heading}</h3>
                <p className="text-sm leading-relaxed text-app-text-secondary">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-app-border p-4 sm:p-6 shrink-0 flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl green-gradient text-white font-bold text-sm hover:brightness-105 transition-all">
              Saya Mengerti
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
