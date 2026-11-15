export function Rating({ value, count }: { value: number; count?: number }) {
  const pct = (value / 5) * 100;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]" aria-label={`Rated ${value} out of 5${count ? `, ${count} reviews` : ""}`}>
      <span className="relative inline-block leading-none tracking-[1px] text-line" aria-hidden="true">
        ★★★★★
        <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-gold" style={{ width: `${pct}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted tabular-nums">({count.toLocaleString("en-IN")})</span>}
    </span>
  );
}
