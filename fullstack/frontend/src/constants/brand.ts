export const BRAND = {
  name: 'Freshly',
  nameUpper: 'FRESHLY',
  legalName: 'Freshly Indonesia',
  tagline: 'Scan Buah & Sayur. Tahu Layaknya. Dalam Sekejap.',
  taglineEn: 'Scan Fruit & Veggies. Know If It\'s Fresh. Instantly.',
  slogan:
    'AI deteksi kesegaran buah & sayur - tahu apakah matang, belum matang, atau busuk, dan apakah layak, kurang layak, atau tidak layak konsumsi.',
  sloganEn:
    'AI freshness detection for fruit & vegetables - know if it is ripe, unripe, or rotten, and whether it is fit, less fit, or unfit to consume.',
  pitch:
    'Platform AI untuk mendeteksi kematangan dan kelayakan buah & sayur - bebas was-was sebelum dikonsumsi.',
  pitchEn:
    'AI platform that detects the ripeness and consumability of fruit & vegetables - eat with confidence.',
  description:
    'Freshly adalah platform AI untuk mendeteksi kematangan (matang / belum matang / busuk) serta kelayakan konsumsi buah & sayur dari satu foto.',
  descriptionEn:
    'Freshly is an AI platform that detects ripeness (ripe / unripe / rotten) and edibility of fruit & vegetables from a single photo.',
  keywords: [
    'deteksi buah',
    'deteksi sayur',
    'kematangan buah',
    'matang belum matang busuk',
    'AI buah segar',
    'scan kesegaran',
    'kelayakan konsumsi',
    'computer vision',
    'fruit ripeness AI',
    'vegetable freshness AI',
    'Freshly Indonesia',
  ],
  siteUrl: 'https://freshly.web.id',
  locale: 'id_ID',
  themeColor: '#22c55e',
  copyrightYear: 2026,
  twitterHandle: '@freshlyid',
} as const;

export const RIPENESS_LABELS = {
  ripe: { id: 'Matang', en: 'Ripe' },
  unripe: { id: 'Belum Matang', en: 'Unripe' },
  rotten: { id: 'Busuk', en: 'Rotten' },
} as const;

export const CONSUMABILITY_LABELS = {
  fit: { id: 'Layak Konsumsi', en: 'Fit to Consume' },
  limited: { id: 'Kurang Layak', en: 'Less Fit' },
  unfit: { id: 'Tidak Layak', en: 'Unfit' },
} as const;

export const COPYRIGHT = `© ${BRAND.copyrightYear} ${BRAND.legalName}. Semua hak dilindungi.`;
export const COPYRIGHT_EN = `© ${BRAND.copyrightYear} ${BRAND.legalName}. All rights reserved.`;
