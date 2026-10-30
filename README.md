# Profile Launchpad (Pons V2)

Launchpad bergaya "tokenize profile" Zora yang meluncurkan token di **Pons V2** (Robinhood Chain, chain id 4663),
plus leaderboard **Top Profile Zora**.

## Fitur

- **Launchpad** – hubungkan wallet; profil Zora milik wallet itu otomatis terdeteksi dan mengisi nama, ticker,
  logo (avatar), deskripsi (bio), dan sosial (X, Farcaster, website). Bisa atur creator tax dan buyback & burn.
  Token diluncurkan lewat `launchToken` di Pons V2 factory `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`,
  dipasangkan dengan ETH: mulai di bonding curve lalu lulus ke Uniswap v4.
- **Top Profile** – profil Zora diurutkan berdasarkan jumlah followers (tanpa data harga/market cap). Kandidat
  diambil dari daftar creator Zora (most valuable, trending, featured, top volume), lalu followers tiap profil
  dibaca lewat `getProfileSocial`.
- **Tombol Tokenize** (di Top Profile dan halaman profil) – membuka form peluncuran `#/launch/<handle>` yang
  otomatis terisi nama, ticker, logo, bio, dan sosial dari profil tersebut. Jika profil bukan milik wallet yang
  terhubung, form memberi peringatan dan penerima fee bisa dipilih: wallet sendiri atau wallet profil.
- **Halaman profil** – cari `@handle` atau `0x…`; menampilkan bio, sosial, followers, dan following.

## Alur peluncuran (Pons V2)

1. Baca `launchEnabled`, `canLaunch(wallet)`, `launchFee`, `maxCreatorTaxBps` dari factory.
2. Pilih launch config (env `VITE_PONS_LAUNCH_CONFIG_ID`, atau config aktif pertama).
3. `previewLaunchEconomics(configId, ETH)` → `expectedEconomics`.
4. Simulasi lalu kirim `launchToken(params, configId, ETH, [])` dengan `value = launchFee`
   (fallback ke overload tanpa `snipeTaxExemptions`).
5. Ambil alamat token & curve dari event `TokenLaunched`.

ABI diambil dari SDK pihak ketiga `0xfnzero/pons-trade-sdk` dan dicocokkan dengan signature resminya;
verifikasi ulang dengan dokumentasi Pons (docs.ponsfamily.com/v2) sebelum produksi.

## Menjalankan

```bash
npm install
cp .env.example .env
npm run dev
```

Build produksi: `npm run build` (hasil di `dist/`, static site).

## Stack

Vite + React + TypeScript, wagmi/viem (Robinhood Chain), `@zoralabs/coins-sdk` (data profil Zora & upload IPFS).

> Bukan aplikasi resmi Zora maupun Pons. Token baru sangat berisiko.
