import { Avatar } from "./Avatar";
import { TokenizeButton } from "./TokenizeButton";
import { fmtNum, shortAddr } from "../lib/format";
import { useZoraProfileSocial } from "../lib/profile";
import { zoraProfileUrl } from "../lib/zora";

const SOCIAL_URLS: Record<string, (u: string) => string> = {
  twitter: (u) => `https://x.com/${u}`,
  farcaster: (u) => `https://farcaster.xyz/${u}`,
  instagram: (u) => `https://instagram.com/${u}`,
  tiktok: (u) => `https://tiktok.com/@${u}`,
};

export function ProfileView({ id }: { id: string }) {
  const { data: profile, isPending, isError, error, refetch } = useZoraProfileSocial(id);

  if (isPending) return <section className="panel"><span className="skeleton tall" /></section>;
  if (isError)
    return (
      <section className="panel notice notice-error">
        Couldn't load this profile: {(error as Error).message}{" "}
        <button className="link" onClick={() => refetch()}>Retry</button>
      </section>
    );
  if (!profile)
    return (
      <section className="panel center">
        <h2>Profile not found</h2>
        <p className="muted">No Zora profile matches “{id}”.</p>
      </section>
    );

  const socials = Object.entries(profile.socialAccounts).filter(([k, s]) => s?.username && SOCIAL_URLS[k]);

  return (
    <section className="panel profile">
      <div className="profile-head">
        <Avatar src={profile.avatar} name={profile.handle} size={96} />
        <div>
          <h1>{profile.displayName || `@${profile.handle}`}</h1>
          <p className="muted">@{profile.handle}{profile.wallet && ` · ${shortAddr(profile.wallet)}`}</p>
          {profile.bio && <p className="bio">{profile.bio}</p>}
          {socials.length > 0 && (
            <div className="chips">
              {socials.map(([k, s]) => (
                <a key={k} className="chip" href={SOCIAL_URLS[k](s!.username!)} target="_blank" rel="noreferrer">
                  {k} · {s!.username}
                  {s!.followerCount ? ` · ${fmtNum(s!.followerCount)}` : ""}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span className="muted">Followers</span><strong>{fmtNum(profile.followers)}</strong></div>
        <div className="stat"><span className="muted">Following</span><strong>{fmtNum(profile.following)}</strong></div>
      </div>

      <TokenizeButton handle={profile.handle} />

      <div className="row gap">
        <a className="btn btn-ghost" href={zoraProfileUrl(profile.handle)} target="_blank" rel="noreferrer">Open on Zora ↗</a>
      </div>
    </section>
  );
}
