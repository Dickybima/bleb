/**
 * Daftar profil fomo.family untuk "Top Profile Fomo".
 *
 * fomo.family tidak punya API publik, jadi daftar ini diisi manual. Urutan di website otomatis
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

export const FOMO_PROFILES: FomoProfile[] = [
  // Tambahkan profil di sini.
];
