const normalizeDiseaseGroupName = (value) => {
  if (typeof value !== 'string') return null;

  // Common model format: '<Crop>___<Disease>' (e.g., 'Tomato___healthy')
  // We only care about the disease group part.
  let raw = value.trim();
  if (!raw) return null;

  if (raw.includes('___')) {
    const parts = raw.split('___').filter(Boolean);
    raw = parts.length ? parts[parts.length - 1] : raw;
  }

  const normalized = raw
    .replace(/[_\-\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  return normalized || null;
};

const DISEASE_SOLUTIONS = {
  SCAB:
    'Pangkas bagian terinfeksi dan musnahkan. Jaga kebun tetap bersih (buang daun/buah gugur). Kurangi kelembapan dengan jarak tanam dan sirkulasi udara yang baik, hindari penyiraman dari atas. Jika perlu, gunakan fungisida preventif sesuai label dan anjuran setempat.',

  'BLACK ROT':
    'Buang dan musnahkan buah/daun yang terinfeksi (termasuk buah kering/mumifikasi) untuk memutus sumber inokulum. Lakukan pemangkasan agar kanopi tidak lembap, dan hindari percikan air ke daun. Pertimbangkan fungisida preventif sesuai label bila serangan berulang dan kondisi lembap.',

  RUST:
    'Buang daun yang parah terinfeksi bila memungkinkan, dan kurangi kelembapan (sirkulasi udara baik, hindari penyiraman dari atas). Gunakan varietas tahan jika tersedia. Jika diperlukan, aplikasikan fungisida yang terdaftar untuk karat (rust) sesuai label.',

  'POWDERY MILDEW':
    'Perbaiki sirkulasi udara (pangkas/atur jarak tanam) dan hindari pemupukan nitrogen berlebihan. Buang bagian yang sangat terinfeksi. Gunakan fungisida/bahan pengendali embun tepung (mis. sulfur/kalium bikarbonat atau produk terdaftar) sesuai label, terutama sebagai pencegahan.',

  'CERCOSPORA GRAY LEAF SPOT':
    'Kelola sisa tanaman (residu) dan lakukan rotasi tanaman untuk menurunkan sumber penyakit. Pilih varietas/hibrida yang toleran jika tersedia. Pantau perkembangan gejala; bila risiko tinggi, pertimbangkan fungisida sesuai label dan rekomendasi setempat.',

  'NORTHERN LEAF BLIGHT':
    'Gunakan varietas tahan/toleran dan lakukan rotasi tanaman. Kelola residu (pembenaman/kompos yang baik) untuk mengurangi sumber inokulum. Bila serangan meningkat pada fase kritis, fungisida dapat dipertimbangkan sesuai label dan ambang rekomendasi setempat.',

  ESCA:
    'Tidak ada “obat” yang benar-benar menyembuhkan penyakit batang ini. Fokus pada pencegahan: sanitasi alat pangkas, lakukan pemangkasan saat cuaca kering, dan lindungi luka pangkasan bila direkomendasikan. Tanaman dengan gejala berat sebaiknya dipangkas drastis atau diganti untuk mencegah kerugian berulang.',

  'LEAF BLIGHT':
    'Buang daun yang sakit dan jaga kebersihan lahan (sanitasi). Kurangi kelembapan dengan sirkulasi udara baik dan hindari penyiraman dari atas. Lakukan rotasi dan gunakan varietas tahan bila ada. Jika perlu, gunakan fungisida yang sesuai jenis tanaman/penyakit mengikuti label.',

  'CITRUS GREENING':
    'Citrus greening (HLB) tidak memiliki obat yang menyembuhkan. Gunakan bibit bersertifikat sehat, kendalikan vektor (psyllid) dengan strategi terpadu, dan segera pangkas/eradikasi tanaman yang terinfeksi berat sesuai arahan dinas/penyuluh setempat. Jaga sanitasi kebun dan pantau gejala secara rutin.',

  'BACTERIAL SPOT':
    'Gunakan benih/bibit bebas patogen. Hindari penyiraman dari atas dan kerja di tanaman saat daun basah. Buang daun/bagian yang terinfeksi dan lakukan rotasi. Produk berbahan tembaga/bakterisida dapat membantu menekan penyebaran bila digunakan sesuai label dan rekomendasi setempat.',

  'LEAF SCORCH':
    'Periksa faktor pemicu stres (kekurangan air, panas, garam/pupuk berlebih, gangguan akar). Perbaiki pengairan (konsisten, tidak berlebihan), tambah mulsa, dan pangkas bagian daun yang rusak bila perlu. Jika dicurigai penyebab patogen, isolasi tanaman dan konsultasikan dengan penyuluh untuk konfirmasi dan penanganan spesifik.',

  'LEAF MOLD':
    'Kurangi kelembapan: tingkatkan ventilasi, atur jarak tanam, dan hindari penyiraman yang membasahi daun. Buang daun bawah yang terinfeksi. Jika perlu, gunakan fungisida yang terdaftar untuk leaf mold sesuai label, terutama saat kondisi lembap dan tertutup.',

  'SEPTORIA LEAF SPOT':
    'Buang daun terinfeksi dan hindari percikan tanah ke daun (gunakan mulsa). Lakukan rotasi dan jangan bekerja saat tanaman basah. Fungisida protektif dapat digunakan sesuai label bila penyakit menyebar cepat, terutama pada musim hujan/lembap.',

  'SPIDER MITES':
    'Cuci daun dengan semprotan air untuk menurunkan populasi dan tingkatkan kelembapan bila memungkinkan. Pangkas bagian yang parah, dan jaga tanaman tidak stres kekeringan. Gunakan pengendalian hayati (predator mite) atau mitisida/sabun insektisida/minyak hortikultura sesuai label; ulangi sesuai siklus tungau.',

  'TARGET SPOT':
    'Buang daun yang terinfeksi dan perbaiki sirkulasi udara untuk mengurangi kelembapan. Hindari penyiraman dari atas. Rotasi tanaman dan sanitasi lahan membantu menekan sumber penyakit. Jika diperlukan, aplikasikan fungisida yang sesuai mengikuti label dan rekomendasi setempat.',

  VIRUS:
    'Penyakit virus umumnya tidak dapat disembuhkan. Cabut dan musnahkan tanaman yang terinfeksi untuk mencegah penularan. Kendalikan vektor (kutu daun/whitefly/thrips) secara terpadu, gunakan benih/bibit sehat, sanitasi alat, dan kendalikan gulma inang di sekitar lahan.',

  HEALTHY:
    'Tanaman terdeteksi sehat. Lanjutkan perawatan rutin: penyiraman dan pemupukan seimbang, cek hama/penyakit secara berkala, jaga kebersihan area tanam, dan pastikan sirkulasi udara baik untuk pencegahan.',
};

const DISEASE_DETAILS = {
  SCAB: {
    treatment: {
      organic: [
        'Pangkas dan musnahkan bagian yang terinfeksi; bersihkan daun/buah yang gugur.',
        'Hindari penyiraman dari atas untuk mengurangi percikan spora.',
      ],
      chemical: [
        'Gunakan fungisida preventif yang terdaftar untuk tanaman terkait sesuai label dan anjuran setempat.',
      ],
      cultural: [
        'Perbaiki sirkulasi udara (jarak tanam/pemangkasan kanopi).',
        'Lakukan sanitasi kebun secara rutin untuk menurunkan sumber inokulum.',
      ],
    },
    symptoms: [
      'Bercak/lesi gelap pada daun atau buah (kadang tampak seperti kerak).',
      'Permukaan buah menjadi kasar/retak pada serangan berat.',
    ],
  },

  'BLACK ROT': {
    treatment: {
      organic: [
        'Kumpulkan dan musnahkan buah/daun terinfeksi (termasuk buah kering/mumifikasi).',
      ],
      chemical: [
        'Pertimbangkan fungisida preventif sesuai label jika kondisi lembap dan serangan berulang.',
      ],
      cultural: [
        'Pemangkasan untuk mengurangi kelembapan kanopi.',
        'Hindari percikan air ke daun/buah; atur irigasi.',
      ],
    },
    symptoms: [
      'Busuk pada buah dengan bercak gelap yang meluas.',
      'Buah dapat mengering/mumifikasi dan menjadi sumber penularan.',
    ],
  },

  RUST: {
    treatment: {
      organic: ['Buang daun yang parah terinfeksi bila memungkinkan.'],
      chemical: ['Gunakan fungisida karat (rust) yang terdaftar sesuai label.'],
      cultural: [
        'Kurangi kelembapan: sirkulasi udara baik, hindari penyiraman dari atas.',
        'Gunakan varietas tahan jika tersedia.',
      ],
    },
    symptoms: [
      'Bintik/pustula berwarna kuning-oranye/cokelat seperti “karat” di daun.',
      'Daun menguning dan gugur lebih cepat pada serangan berat.',
    ],
  },

  'POWDERY MILDEW': {
    treatment: {
      organic: [
        'Buang bagian yang sangat terinfeksi untuk menurunkan sumber jamur.',
        'Produk organik terdaftar (mis. sulfur/kalium bikarbonat) dapat membantu bila sesuai tanaman.',
      ],
      chemical: ['Gunakan fungisida embun tepung yang terdaftar sesuai label.'],
      cultural: [
        'Perbaiki sirkulasi udara (pangkas/atur jarak tanam).',
        'Hindari pemupukan nitrogen berlebihan yang memicu daun terlalu rimbun.',
      ],
    },
    symptoms: [
      'Lapisan putih seperti bedak pada permukaan daun/batang.',
      'Daun melengkung/menguning, pertumbuhan terhambat.',
    ],
  },

  'CERCOSPORA GRAY LEAF SPOT': {
    treatment: {
      organic: ['Kelola residu tanaman (sanitasi) untuk mengurangi sumber penyakit.'],
      chemical: ['Jika risiko tinggi, fungisida dapat dipertimbangkan sesuai label dan rekomendasi setempat.'],
      cultural: ['Rotasi tanaman dan pilih varietas/hibrida toleran jika tersedia.'],
    },
    symptoms: [
      'Bercak persegi/oval berwarna abu-abu dengan tepi lebih gelap pada daun.',
      'Bercak menyatu menyebabkan daun mengering lebih cepat.',
    ],
  },

  'NORTHERN LEAF BLIGHT': {
    treatment: {
      organic: ['Buang daun yang sangat terinfeksi bila memungkinkan (terutama daun bawah).'],
      chemical: ['Jika serangan meningkat pada fase kritis, fungisida dapat dipertimbangkan sesuai label dan ambang setempat.'],
      cultural: [
        'Gunakan varietas tahan/toleran.',
        'Rotasi tanaman dan kelola residu (pembenaman/kompos) untuk menurunkan inokulum.',
        'Kurangi kelembapan kanopi dengan jarak tanam dan sirkulasi udara baik.',
      ],
    },
    symptoms: [
      'Bercak memanjang berwarna abu-abu/cokelat (seperti cerutu) pada daun.',
      'Sering dimulai dari daun bagian bawah lalu naik ke atas.',
    ],
  },

  ESCA: {
    treatment: {
      organic: ['Tidak ada terapi yang benar-benar menyembuhkan; fokus pada pencegahan dan sanitasi.'],
      chemical: ['Perlindungan luka pangkasan hanya bila direkomendasikan untuk kebun/komoditas setempat.'],
      cultural: [
        'Sanitasi alat pangkas; pangkas saat cuaca kering.',
        'Tanaman dengan gejala berat dapat dipangkas drastis atau diganti.',
      ],
    },
    symptoms: [
      'Daun menunjukkan pola belang/nekrosis (sering disebut “tiger stripes”).',
      'Penurunan vigor; gejala pada batang/kayu pada kasus berat.',
    ],
  },

  'LEAF BLIGHT': {
    treatment: {
      organic: ['Buang daun yang sakit dan musnahkan; jaga sanitasi lahan.'],
      chemical: ['Gunakan fungisida yang sesuai komoditas/penyakit mengikuti label jika diperlukan.'],
      cultural: [
        'Kurangi kelembapan (sirkulasi udara baik, hindari penyiraman dari atas).',
        'Rotasi tanaman dan gunakan varietas tahan bila tersedia.',
      ],
    },
    symptoms: ['Bercak cokelat/kehitaman yang meluas hingga daun mengering (blight).'],
  },

  'CITRUS GREENING': {
    treatment: {
      organic: ['Tidak ada obat yang menyembuhkan; fokus pada pencegahan dan manajemen kebun.'],
      chemical: ['Pengendalian vektor (psyllid) mengikuti rekomendasi setempat; pilih produk terdaftar bila digunakan.'],
      cultural: [
        'Gunakan bibit bersertifikat sehat.',
        'Pantau gejala, dan lakukan eradikasi/pemangkasan sesuai arahan penyuluh/dinas setempat.',
        'Jaga sanitasi kebun dan kendalikan gulma inang.',
      ],
    },
    symptoms: [
      'Daun menguning tidak merata (blotchy mottle).',
      'Buah kecil/berbentuk tidak normal, rasa pahit, biji abortif.',
    ],
  },

  'BACTERIAL SPOT': {
    treatment: {
      organic: ['Gunakan benih/bibit sehat; buang daun/bagian terinfeksi bila memungkinkan.'],
      chemical: ['Produk berbahan tembaga/bakterisida dapat membantu menekan penyebaran bila sesuai label.'],
      cultural: [
        'Hindari kerja saat daun basah dan hindari penyiraman dari atas.',
        'Rotasi tanaman dan sanitasi lahan.',
      ],
    },
    symptoms: [
      'Bercak kecil berair yang berubah menjadi cokelat/kehitaman.',
      'Pada buah dapat muncul bercak kasar/koreng.',
    ],
  },

  'LEAF SCORCH': {
    treatment: {
      organic: ['Kurangi stres tanaman: mulsa, pemangkasan ringan bagian rusak bila perlu.'],
      chemical: ['Jika dicurigai patogen, konfirmasi diagnosis sebelum aplikasi pestisida.'],
      cultural: [
        'Perbaiki pengairan (konsisten, tidak berlebihan) dan manajemen nutrisi.',
        'Cek salinitas/pupuk berlebih dan kesehatan akar.',
      ],
    },
    symptoms: ['Tepi daun mengering/terbakar, sering terkait stres air/panas atau gangguan fisiologis/patogen tertentu.'],
  },

  'LEAF MOLD': {
    treatment: {
      organic: ['Buang daun bawah yang terinfeksi; kurangi kelembapan ruangan/kebun.'],
      chemical: ['Gunakan fungisida leaf mold terdaftar sesuai label bila diperlukan.'],
      cultural: ['Tingkatkan ventilasi, atur jarak tanam, dan hindari membasahi daun saat penyiraman.'],
    },
    symptoms: [
      'Bercak kuning pucat di atas daun, dengan lapisan jamur (abu/kehijauan) di bawah daun.',
      'Sering muncul pada kondisi lembap dan sirkulasi udara buruk.',
    ],
  },

  'SEPTORIA LEAF SPOT': {
    treatment: {
      organic: ['Buang daun terinfeksi; gunakan mulsa untuk mengurangi percikan tanah ke daun.'],
      chemical: ['Fungisida protektif dapat dipakai sesuai label bila penyakit menyebar cepat.'],
      cultural: ['Rotasi tanaman, hindari kerja saat tanaman basah, dan jaga jarak tanam.'],
    },
    symptoms: [
      'Bercak kecil bulat cokelat/abu-abu dengan titik hitam kecil (pycnidia) di tengah.',
      'Biasanya mulai dari daun bawah.',
    ],
  },

  'SPIDER MITES': {
    treatment: {
      organic: [
        'Semprot air ke bawah daun untuk menurunkan populasi.',
        'Gunakan sabun insektisida/minyak hortikultura jika sesuai label tanaman.',
        'Pertimbangkan musuh alami (predator mites) bila tersedia.',
      ],
      chemical: ['Gunakan mitisida terdaftar sesuai label; ulangi sesuai siklus tungau.'],
      cultural: ['Jaga tanaman tidak stres kekeringan; pangkas bagian parah; tingkatkan kelembapan bila memungkinkan.'],
    },
    symptoms: [
      'Bercak kuning halus (stippling) pada daun.',
      'Jaring halus di bawah daun/antar ruas pada serangan berat.',
    ],
  },

  'TARGET SPOT': {
    treatment: {
      organic: ['Buang daun terinfeksi; jaga kebersihan area tanam.'],
      chemical: ['Gunakan fungisida yang sesuai mengikuti label bila diperlukan.'],
      cultural: ['Perbaiki sirkulasi udara dan hindari penyiraman dari atas; lakukan rotasi tanaman.'],
    },
    symptoms: ['Bercak bulat dengan pola konsentris seperti “target/bullseye” pada daun.'],
  },

  VIRUS: {
    treatment: {
      organic: ['Cabut dan musnahkan tanaman terinfeksi untuk mencegah penularan.'],
      chemical: ['Pestisida tidak menyembuhkan virus; fokus pengendalian vektor jika digunakan sesuai rekomendasi setempat.'],
      cultural: [
        'Kendalikan vektor (kutu daun/whitefly/thrips) dan gulma inang.',
        'Gunakan benih/bibit sehat dan sanitasi alat.',
      ],
    },
    symptoms: [
      'Daun belang/mosaik, keriting, pertumbuhan kerdil.',
      'Gejala sering tidak merata antar daun/cabang.',
    ],
  },

  HEALTHY: {
    treatment: {
      organic: ['Pantau rutin hama/penyakit; buang daun tua/rusak bila perlu.'],
      chemical: ['Tidak perlu pestisida jika tidak ada gejala; gunakan hanya bila ada indikasi hama/penyakit spesifik.'],
      cultural: ['Penyiraman dan pemupukan seimbang, sanitasi area tanam, dan sirkulasi udara baik.'],
    },
    symptoms: ['Tidak ada gejala khas penyakit; daun tampak segar tanpa bercak mencurigakan.'],
  },
};

const joinSentences = (items) => {
  if (!Array.isArray(items)) return '';
  const clean = items.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
  return clean.join(' ');
};

export const getDiseaseDetails = (diseaseGroup) => {
  const key = normalizeDiseaseGroupName(diseaseGroup);
  if (!key) return null;
  return DISEASE_DETAILS[key] || null;
};

export const getDiseaseDetailsWithFallback = (diseaseGroup) => {
  const details = getDiseaseDetails(diseaseGroup);
  if (details) return details;

  return {
    treatment: {
      organic: ['Pastikan foto jelas dan ulangi pengambilan gambar dari jarak dekat.'],
      chemical: ['Konsultasikan rekomendasi pestisida yang sesuai dengan komoditas setempat.'],
      cultural: ['Jaga sanitasi kebun dan perbaiki sirkulasi udara untuk pencegahan umum.'],
    },
    symptoms: ['Gejala belum tersedia untuk kelas ini.'],
  };
};

export const getDiseaseSolution = (diseaseGroup) => {
  const key = normalizeDiseaseGroupName(diseaseGroup);
  if (!key) return null;
  return DISEASE_SOLUTIONS[key] || null;
};

export const getDiseaseSolutionWithFallback = (diseaseGroup) => {
  return (
    getDiseaseSolution(diseaseGroup) ||
    'Rekomendasi belum tersedia untuk kelas ini. Pastikan foto jelas, lalu konsultasikan dengan penyuluh/ahli setempat untuk penanganan yang paling tepat.'
  );
};

export const normalizeDiseaseGroup = normalizeDiseaseGroupName;
