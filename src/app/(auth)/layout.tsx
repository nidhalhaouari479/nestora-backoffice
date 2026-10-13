import { Brand } from "@/components/BrandLogo";

const STATS = [
  { value: "100%", label: "cases with a structured record" },
  { value: "0", label: "unexplained payment differences" },
  { value: "24/7", label: "auditable operational history" },
];

// Shared split screen of AP1A_01, AP1A_02, AP1A_03 and AP1A_18.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="auth-split">
      <aside className="auth-brand-panel">
        <Brand />
        <div className="auth-pitch">
          <h2>Every move-in,<br />under control.</h2>
          <p>Manage verified supply, student cases, visits, holds, contracts, payments, move-ins and monthly rent from one authoritative workspace.</p>
          <ul className="auth-stats">
            {STATS.map((stat) => (
              <li key={stat.value}><strong>{stat.value}</strong><span>{stat.label}</span></li>
            ))}
          </ul>
        </div>
        <span className="auth-ring auth-ring-outer" aria-hidden="true" />
        <span className="auth-ring auth-ring-inner" aria-hidden="true" />
      </aside>
      <main className="auth-form-panel">{children}</main>
    </div>
  );
}
