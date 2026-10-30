import { useMemo } from "react";
import CircularSplitRoll, { type CircularSplitRollItem } from "@/components/ui/circular-split-roll";
import { useTopProfiles } from "@/lib/topProfiles";

const COUNT = 8;

/** Scroll-driven roll of the top Zora profiles on Home: names circle on the left, avatars on the right. */
export function ProfileRoll() {
  const top = useTopProfiles();

  const items = useMemo<CircularSplitRollItem[]>(
    () =>
      (top.data ?? [])
        .filter((p) => p.avatarLarge || p.avatar)
        .slice(0, COUNT)
        .map((p) => ({ id: p.handle, title: p.displayName || `@${p.handle}`, image: p.avatarLarge ?? p.avatar, alt: p.handle })),
    [top.data],
  );

  if (items.length < 3) return null;

  return (
    // Full-bleed out of the centered <main> column; margins (not a transform) so the GSAP pin stays fixed.
    <div className="mx-[calc(50%-50vw)] w-screen">
      <CircularSplitRoll items={items} background="transparent" radius={500} cardSize={205} textSideScale={0.68} textSideOpacity={0.18} />
    </div>
  );
}
