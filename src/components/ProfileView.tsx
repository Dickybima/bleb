import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@zoralabs/coins-sdk";
import { Avatar } from "./Avatar";
import { TokenizeButton } from "./TokenizeButton";
import { fmtNum, fmtPct, fmtUsd, pctChange, shortAddr } from "../lib/format";
import { zoraCoinUrl, zoraProfileUrl } from "../lib/zora";

export function useZoraProfile(identifier?: string) {
  return useQuery({
    queryKey: ["profile", identifier?.toLowerCase()],
    enabled: Boolean(identifier),
    queryFn: async () => {
      const res = await getProfile({ identifier: identifier! });
      return res.data?.profile ?? null;
    },
  });
}

const SOCIAL_URLS: Record<string, (u: string) => string> = {
  twitter: (u) => `https://x.com/${u}`,
  farcaster: (u) => `https://farcaster.xyz/${u}`,
  instagram: (u) => `https://instagram.com/${u}`,
  tiktok: (u) => `https://tiktok.com/@${u}`,
};

export function ProfileView({ id }: { id: string }) {
  const { data: profile, isPending, isError, error } = useZoraProfile(id);

  if (isPending) return <section className="panel"><span className="skeleton tall" /></section>;
  if (isError) return <section className="panel notice notice-error">Gagal memuat profil: {(error as Error).message}</section>;
  if (!profile)
    return (
      <section className="panel center">
        <h2>Profil tidak ditemukan</h2>
        <p className="muted">Tidak ada profil Zora untuk “{id}”.</p>
      </section>
    );

  const coin = profile.creatorCoin;
  const pct = coin ? pctChange(coin.marketCap, coin.marketCapDelta24h) : null;
  const socials = Object.entries(profile.socialAccounts ?? {}).filter(([, s]) => s?.username);

  return (
    <section className="panel profile">
      <div className="profile-head">
        <Avatar src={profile.avatar?.medium} name={profile.handle} size={96} />
        <div>
          <h1>{profile.displayName || `@${profile.handle}`}</h1>
          <p className="muted">@{profile.handle} · {shortAddr(profile.publicWallet.walletAddress)}</p>
          {profile.bio && <p className="bio">{profile.bio}</p>}
          {socials.length > 0 && (
            <div className="chips">
              {socials.map(([k, s]) => (
                <a key={k} className="chip" href={SOCIAL_URLS[k]?.(s!.username!)} target="_blank" rel="noreferrer">
                  {k} · {s!.username}
                  {s!.followerCount ? ` · ${fmtNum(s!.followerCount)}` : ""}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {coin ? (
        <div className="stats">
          <div className="stat"><span className="muted">Market cap</span><strong>{fmtUsd(coin.marketCap)}</strong></div>
          <div className="stat">
            <span className="muted">Perubahan 24j</span>
            <strong className={pct === null || pct === 0 ? "" : pct > 0 ? "up" : "down"}>{fmtPct(pct)}</strong>
          </div>
          <div className="stat"><span className="muted">Creator coin</span><strong className="mono">{shortAddr(coin.address)}</strong></div>
        </div>
      ) : (
        <TokenizeButton
          handle={profile.handle}
          bio={profile.bio}
          avatar={profile.avatar?.medium}
          wallets={[profile.publicWallet.walletAddress, ...profile.linkedWallets.edges.map((e) => e.node.walletAddress)]}
        />
      )}

      <div className="row gap">
        <a className="btn btn-ghost" href={zoraProfileUrl(profile.handle)} target="_blank" rel="noreferrer">Buka di Zora ↗</a>
        {coin && <a className="btn btn-primary" href={zoraCoinUrl(coin.address)} target="_blank" rel="noreferrer">Trade coin ↗</a>}
      </div>
    </section>
  );
}
