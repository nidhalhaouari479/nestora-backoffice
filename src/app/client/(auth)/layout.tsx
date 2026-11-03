import { Brand } from "@/components/BrandLogo";

// Client portal sign-in, same split screen as the team login.
export default function ClientAuthLayout({ children }: LayoutProps<"/client">) {
  return (
    <div className="auth-split">
      <aside className="auth-brand-panel">
        <Brand />
        <div className="auth-pitch">
          <h2>Ton calendrier,<br />tes visites.</h2>
          <p>Indique quand ta maison peut être visitée. Les étudiants ne réservent que les créneaux que tu laisses libres, et tu vois chaque visite confirmée.</p>
        </div>
        <span className="auth-ring auth-ring-outer" aria-hidden="true" />
        <span className="auth-ring auth-ring-inner" aria-hidden="true" />
      </aside>
      <main className="auth-form-panel">{children}</main>
    </div>
  );
}
