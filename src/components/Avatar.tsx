import { useState } from "react";

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const style = { width: size, height: size };
  if (src && failed !== src)
    return <img className="avatar" src={src} alt="" style={style} loading="lazy" onError={() => setFailed(src)} />;
  return (
    <span className="avatar avatar-fallback" style={{ ...style, fontSize: size * 0.42 }} aria-hidden>
      {name.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
    </span>
  );
}
