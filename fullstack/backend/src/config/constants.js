module.exports = {
  SCAN: {
    FRUIT_TYPES: ['banana', 'mango', 'orange', 'chili', 'paprika', 'tomato'],
    RIPENESS_LEVELS: {
      RIPE: 'ripe',
      UNRIPE: 'unripe',
      ROTTEN: 'rotten',
      OVERRIPE: 'overripe',
    },
    UNCONSUMABLE_LEVELS: ['rotten', 'unripe'],
    DEFAULT_RIPENESS: 'unknown',
  },
  AI: {
    AGRONOMIST_PROMPT: `
      Anda adalah seorang ahli agronomi dan nutrisi buah-buahan profesional.
      Berdasarkan hasil analisis AI berikut, buatlah ringkasan diagnostik yang mendalam, profesional, dan informatif dalam Bahasa Indonesia.

      Data Analisis:
      - Jenis Buah: {{fruitType}}
      - Status Kematangan: {{ripenessLevel}}
      - Kelayakan Konsumsi: {{isConsumable}}
      - Skor Keyakinan: {{confidence}}%

      Instruksi:
      1. Tuliskan ringkasan diagnostik yang terdiri dari 3-4 kalimat yang menjelaskan kondisi buah tersebut secara ilmiah namun mudah dimengerti.
      2. Tambahkan saran penyimpanan atau konsumsi yang spesifik untuk kondisi tersebut.
      3. Gunakan nada bicara yang profesional dan meyakinkan.
      4. Jangan gunakan format markdown (seperti bold atau list), berikan teks mentah saja.
    `,
    ARTICLE_GENERATOR_PROMPT: `
      Generate a comprehensive, detailed, and highly engaging article in Indonesian about the topic: "{{topic}}" (category: "{{category}}").
      
      Requirements:
      1. Length and Depth: The article must be long and complex (at least 600-800 words), providing deep value, scientific/educational facts, and detailed sections.
      2. HTML Structure: The content must be structured using HTML tags. Use <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, and <blockquote> where appropriate.
      3. Inline Images: Embed 1 or 2 relevant, beautiful food/healthy living/fruit/vegetable images inside the article content using <img src="..." alt="..." class="rounded-xl my-4 w-full object-cover max-h-[300px]" /> tags. Use realistic and valid food-related image URLs from Unsplash (e.g., matching fruit/vegetable photos like "https://images.unsplash.com/photo-1610832958506-ee563361f155?q=80&w=600", "https://images.unsplash.com/photo-1519985176271-adb1088fa94c?q=80&w=600", etc.).
      
      You must respond ONLY with a valid JSON object. Do not include any explanation or markdown code block markers outside the JSON.
      The JSON keys must be exactly "title", "excerpt", and "content" in lowercase:
      {
        "title": "An attractive, click-worthy title for the article in Indonesian",
        "excerpt": "A brief summary/introductory paragraph of the article in Indonesian (150-250 characters)",
        "content": "The full body of the article in Indonesian, in HTML format, containing long, detailed sections, headings, paragraphs, lists, and inline images as requested."
      }
    `,
  },
};
