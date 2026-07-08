import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOT Chain Launchpad",
  description: "Fair-launch token launchpad on BOT Chain. Bonding curve → auto-graduates to DEX at 500 BOT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(6,6,15,.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
              <span style={{ color: "var(--primary)", fontSize: 22 }}>⬡</span>
              <span className="grad">BOT Launch</span>
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <a href="/" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none" }}>Explore</a>
              <a href="/create" className="btn-primary" style={{ padding: "6px 16px", fontSize: 13 }}>+ Create Token</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer style={{ marginTop: 80, borderTop: "1px solid var(--border)", padding: "32px 16px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
          BOT Chain Launchpad · Chain ID 968 ·{" "}
          <a href="https://scan.bohr.life" target="_blank" style={{ color: "var(--primary)" }}>Explorer</a> ·{" "}
          <a href="https://faucet.botchain.ai/basic" target="_blank" style={{ color: "var(--primary)" }}>Faucet</a> ·{" "}
          <a href="https://dex.botchain.ai" target="_blank" style={{ color: "var(--primary)" }}>DEX</a>
        </footer>
      </body>
    </html>
  );
}
