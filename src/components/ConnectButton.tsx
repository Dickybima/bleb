import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { shortAddr } from "../lib/format";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);

  if (isConnected && chainId !== base.id) {
    return (
      <button className="btn btn-warn" onClick={() => switchChain({ chainId: base.id })}>
        Pindah ke Base
      </button>
    );
  }

  if (isConnected) {
    return (
      <button className="btn btn-ghost" onClick={() => disconnect()} title="Klik untuk disconnect">
        {shortAddr(address)}
      </button>
    );
  }

  return (
    <div className="dropdown">
      <button className="btn btn-primary" onClick={() => setOpen((o) => !o)} disabled={isPending}>
        {isPending ? "Menghubungkan…" : "Connect Wallet"}
      </button>
      {open && (
        <div className="dropdown-menu">
          {connectors.map((c) => (
            <button
              key={c.uid}
              onClick={() => {
                connect({ connector: c, chainId: base.id });
                setOpen(false);
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
