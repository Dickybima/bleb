# Zora Profile Launchpad

Website launchpad untuk **men-tokenize profil Zora** menjadi creator coin di Base, plus leaderboard **Top Profile Zora**.

## Fitur

- **Launchpad** – hubungkan wallet, profil Zora milik wallet itu otomatis terdeteksi (handle, bio, avatar sebagai default).
  Klik *Luncurkan* untuk men-deploy creator coin lewat `deployCreatorCoin` di Zora Coin Factory
  (`0x777777751622c0d3258f214F9DF38E35BF45baF3`, Base). Pool config diambil live dari Zora API
  (pasangan $ZORA, Uniswap v4). Jika profil sudah punya creator coin, launchpad menampilkan coin tersebut.
- **Top Profile** – peringkat creator coin berdasarkan Market Cap, Volume 24 jam, Trending, dan Profil Baru,
  dengan pagination "Muat lebih banyak".
- **Halaman profil** – cari `@handle` atau alamat `0x…` untuk melihat bio, akun sosial, dan statistik creator coin.

## Menjalankan

```bash
npm install
cp .env.example .env   # isi VITE_ZORA_API_KEY
npm run dev
```

Build produksi: `npm run build` (hasil di `dist/`, bisa di-deploy ke Vercel/Netlify/Cloudflare Pages sebagai static site).

### Variabel lingkungan

| Nama | Keterangan |
| --- | --- |
| `VITE_ZORA_API_KEY` | API key dari zora.co/settings/developer. Dibutuhkan untuk upload gambar + metadata ke IPFS. Tanpa ini, form meminta Metadata URI manual. |
| `VITE_PLATFORM_REFERRER` | Alamat penerima platform referral fee dari coin yang diluncurkan lewat situs ini. Opsional. |

## Stack

Vite + React + TypeScript, wagmi/viem (Base), `@zoralabs/coins-sdk`, `@zoralabs/protocol-deployments`.

> Bukan aplikasi resmi Zora. Apakah coin otomatis tertaut sebagai creator coin profil di zora.co ditentukan oleh indexer Zora.
