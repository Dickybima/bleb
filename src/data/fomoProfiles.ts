/**
 * Daftar profil fomo.family untuk "Top Profile Fomo" (yang tampil di website hanya daftar ini).
 *
 * Daftar ini diisi manual. Jika FOMO_API_KEY di-set, foto, bio, dan sosial ikut diambil dari API saat Tokenize. Urutan di website otomatis
 * berdasarkan `followers` (terbesar di atas). Salin data dari halaman profil di fomo.family.
 *
 * Contoh entri:
 * {
 *   handle: "namaakun",                          // tanpa @, wajib
 *   displayName: "Nama Tampilan",
 *   avatar: "https://…/foto.jpg",                // URL gambar (dipakai juga sebagai logo token)
 *   bio: "Bio singkat dari profil fomo.",
 *   followers: 12500,                            // wajib, angka
 *   twitter: "namaakunx",                        // username X tanpa @ (opsional)
 *   website: "https://…",                        // opsional
 *   wallet: "0x…",                               // wallet EVM pemilik (opsional, untuk opsi penerima fee)
 * },
 */
export type FomoProfile = {
  handle: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  followers: number;
  twitter?: string;
  website?: string;
  wallet?: string;
};

// Top 25 profil fomo.family berdasarkan followers (angka dibulatkan seperti tampilannya, mis. 824.3K → 824_300).
export const FOMO_PROFILES: FomoProfile[] = [
  { handle: "unipcs", displayName: "Unipcs", followers: 824_300 },
  { handle: "DumbCrayonEater", displayName: "DumbCrayonEater", followers: 672_900 },
  { handle: "PoorGoat_", displayName: "PoorGoat", followers: 617_300 },
  { handle: "pointfarmcap", displayName: "point farm capital", followers: 527_500 },
  { handle: "The__Solstice", displayName: "TheSOLstice", followers: 426_100 },
  { handle: "frankdegods", displayName: "frank", followers: 389_500 },
  { handle: "tvmx", displayName: "TVMX", followers: 368_100 },
  { handle: "change", displayName: "change", followers: 351_700 },
  { handle: "ether_monk", displayName: "Ethermonk", followers: 337_400 },
  { handle: "Quanterty", displayName: "Qwerty", followers: 329_600 },
  { handle: "Salem1299534", displayName: "Salem", followers: 292_200 },
  { handle: "Rowdy", displayName: "Rowdy", followers: 230_500 },
  { handle: "ogle", displayName: "ogle", followers: 187_300 },
  { handle: "Natan_benish", displayName: "Nate", followers: 185_100 },
  { handle: "SerBeetle", displayName: "Beetle", followers: 165_800 },
  { handle: "AvgJoesCrypto", displayName: "AJC", followers: 154_500 },
  { handle: "rasmr", displayName: "rasmr", followers: 129_200 },
  { handle: "econoar", displayName: "eric.eth", followers: 126_700 },
  { handle: "brrrgrrrz", displayName: "Burgz", followers: 126_600 },
  { handle: "Pasterniq", displayName: "Pasterniq", followers: 123_100 },
  { handle: "397397", displayName: "Lasercat397", followers: 118_700 },
  { handle: "ResellCalendar", displayName: "RC", followers: 112_600 },
  { handle: "leo", displayName: "leo", followers: 110_800 },
  { handle: "heat", displayName: "heat", followers: 104_500 },
  { handle: "ExactTallTakin", displayName: "ExactTallTakin", followers: 102_700 },
];
