import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getExploreList, type ListType } from "@zoralabs/coins-sdk";
import { Avatar } from "./Avatar";
import { fmtNum, fmtPct, fmtUsd, pctChange } from "../lib/format";
import { profileHref } from "../lib/router";
import { zoraCoinUrl } from "../lib/zora";

const TABS: { id: ListType; label: string }[] = [
  { id: "MOST_VALUABLE_CREATORS", label: "Market Cap" },
  { id: "TOP_VOLUME_CREATORS_24H", label: "Volume 24j" },
  { id: "TRENDING_CREATORS", label: "Trending" },
  { id: "NEW_CREATORS", label: "Baru" },
];

const PAGE_SIZE = 20;

export function TopProfiles({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<ListType>("MOST_VALUABLE_CREATORS");

  const query = useInfiniteQuery({
    queryKey: ["explore", tab],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await getExploreList(tab, { count: compact ? 10 : PAGE_SIZE, after: pageParam });
      if (!res.data) throw new Error("Zora API tidak merespons.");
      return res.data.exploreList;
    },
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  });

  const rows = query.data?.pages.flatMap((p) => p.edges.map((e) => e.node)) ?? [];

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Top Profile Zora</h2>
          <p className="muted">Creator coin di Base, live dari Zora API.</p>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "tab active" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {query.isError && (
        <div className="notice notice-error">
          Gagal memuat data: {(query.error as Error).message}{" "}
          <button className="link" onClick={() => query.refetch()}>Coba lagi</button>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Profil</th>
              <th className="num">Market Cap</th>
              <th className="num">24j</th>
              <th className="num hide-sm">Volume 24j</th>
              <th className="num hide-sm">Holder</th>
            </tr>
          </thead>
          <tbody>
            {query.isPending &&
              Array.from({ length: compact ? 5 : 10 }, (_, i) => (
                <tr key={i} className="skeleton-row">
                  <td colSpan={6}><span className="skeleton" /></td>
                </tr>
              ))}
            {rows.map((coin, i) => {
              const handle = coin.creatorProfile?.handle ?? coin.symbol;
              const pct = pctChange(coin.marketCap, coin.marketCapDelta24h);
              return (
                <tr key={coin.id}>
                  <td className="num rank">{i + 1}</td>
                  <td>
                    <a className="profile-cell" href={profileHref(coin.creatorProfile?.handle ?? coin.creatorAddress ?? coin.address)}>
                      <Avatar src={coin.creatorProfile?.avatar?.previewImage.small} name={handle} size={36} />
                      <span>
                        <strong>@{handle}</strong>
                        <small className="muted">${coin.symbol}</small>
                      </span>
                    </a>
                  </td>
                  <td className="num">
                    <a href={zoraCoinUrl(coin.address)} target="_blank" rel="noreferrer">{fmtUsd(coin.marketCap)}</a>
                  </td>
                  <td className={`num ${pct === null || pct === 0 ? "" : pct > 0 ? "up" : "down"}`}>{fmtPct(pct)}</td>
                  <td className="num hide-sm">{fmtUsd(coin.volume24h)}</td>
                  <td className="num hide-sm">{fmtNum(coin.uniqueHolders)}</td>
                </tr>
              );
            })}
            {!query.isPending && !query.isError && rows.length === 0 && (
              <tr><td colSpan={6} className="muted center">Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {compact ? (
        <a className="btn btn-ghost block" href="#/top">Lihat semua top profile →</a>
      ) : (
        query.hasNextPage && (
          <button className="btn btn-ghost block" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? "Memuat…" : "Muat lebih banyak"}
          </button>
        )
      )}
    </section>
  );
}
