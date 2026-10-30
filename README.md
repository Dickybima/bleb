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
- **Top Profile Fomo** – berdampingan dengan Top Profile Zora: leaderboard trader fomo.family (24j / 7h / 30h /
  Semua) dari API pihak ketiga [getfomoapi.fun](https://getfomoapi.fun) lewat `/api/fomo/leaderboard`. Kolom
  menampilkan followers bila tersedia, selain itu PnL. Tokenize membuka `#/launch/fomo/<handle>` yang terisi dari
  `/api/fomo/user` (nama, foto, bio, X, website, wallet EVM). Tanpa `FOMO_API_KEY`, dipakai daftar manual di
  `src/data/fomoProfiles.ts`.
- **Tombol Tokenize** (di Top Profile dan halaman profil) – langsung membuka formulir deploy `#/launch/<handle>`
  yang otomatis terisi nama, ticker, logo, bio, dan sosial dari profil tersebut. Formulir tampil tanpa harus
  connect wallet dulu; wallet baru diminta saat menekan tombol luncurkan. Jika profil bukan milik wallet yang
  terhubung, form memberi peringatan dan penerima fee bisa dipilih: wallet sendiri atau wallet profil.
- **Explore** – hanya token yang diluncurkan lewat website ini (token Pons dari tempat lain tidak ditampilkan).
  Data dibaca langsung dari event `TokenLaunched` di factory Pons V2 (tanpa server), terbaru di atas, refresh
  otomatis tiap 30 detik dan langsung diperbarui setelah peluncuran berhasil. Token dari website ini dikenali dari
  penanda 6 byte di awal `salt` (`keccak256("profile-launchpad/v1")`), yang dibaca kembali dari calldata transaksi.
- **Connect wallet** – modal RainbowKit dengan banyak pilihan: MetaMask, Coinbase Wallet, Rabby, OKX, Trust,
  Rainbow, WalletConnect (QR untuk wallet HP), Phantom, Bitget, Binance, Uniswap, Zerion, Brave, Ledger, Safe,
  dan wallet browser lain. Wallet yang terpasang terdeteksi otomatis.
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

## API (Vercel Functions)

Semua data Zora diambil lewat serverless function di folder `api/` (otomatis aktif saat deploy di Vercel):

- `GET /api/top-profiles` – ranking Top Profile dihitung di server sekali, di-cache CDN 10 menit
  (`stale-while-revalidate` 1 hari). Browser cukup 1 request, bukan ~100 request ke Zora.
- `GET /api/zora/{explore|profile|profileSocial}` – proxy ber-cache ke Zora API.
- `GET /api/fomo/leaderboard?window=24h|7d|30d|all` dan `GET /api/fomo/user?handle=` – data fomo.family dari
  getfomoapi.fun (butuh `FOMO_API_KEY`), di-cache CDN 10 menit, retry saat kena batas 5 request/detik.

Server memakai `ZORA_API_KEY` (rahasia, tidak ikut ke browser) dan otomatis retry saat Zora membalas 429/5xx.
Di `npm run dev`, `/api/zora` di-proxy oleh Vite; Top Profile dihitung di browser sebagai fallback.

## Menjalankan

```bash
npm install
cp .env.example .env   # isi VITE_WALLETCONNECT_PROJECT_ID (gratis di cloud.reown.com)
npm run dev
```

Build produksi: `npm run build` (hasil di `dist/`, static site).

## Stack

Vite + React + TypeScript, wagmi/viem + RainbowKit (Robinhood Chain), `@zoralabs/coins-sdk` (data profil Zora & upload IPFS).

> Bukan aplikasi resmi Zora maupun Pons. Token baru sangat berisiko.
