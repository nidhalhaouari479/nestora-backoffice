export function BrandLogo({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="41" height="41" rx="11.5" fill="#ffffff08" stroke="#ffffff47" />
      <path d="M12 32V19.5C12 14.25 16.03 10 21 10C25.97 10 30 14.25 30 19.5V32" stroke="#66dfc5" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M21 24.5V32" stroke="#ef765e" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <BrandLogo />
      <div>
        <strong>Nestora</strong>
        <small>Management System</small>
      </div>
    </div>
  );
}
