import { launchHref } from "../lib/router";

/** Sends the user to the launch form prefilled from this profile. */
export function TokenizeButton({ handle }: { handle: string }) {
  return (
    <div className="tokenize">
      <div>
        <strong>Tokenize profil ini di Pons</strong>
        <p className="muted">
          Nama, ticker <b>${handle.toUpperCase()}</b>, logo, bio, dan sosial akan terisi otomatis di form peluncuran.
        </p>
      </div>
      <a className="btn btn-primary btn-lg" href={launchHref(handle)}>Tokenize</a>
    </div>
  );
}
