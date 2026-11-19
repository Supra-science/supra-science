/**
 * HeroVisual — original inline SVG: a connected-systems motif.
 * Center core linked to five engineering domains. Zero-cost, no assets.
 */
export function HeroVisual({ lang = "en" }: { lang?: "en" | "ar" }) {
  const ar = lang === "ar";
  const L = ar
    ? { sw: "برمجيات", ai: "ذكاء اصطناعي", iot: "إنترنت الأشياء", sn: "حساس", cl: "سحابة" }
    : { sw: "Software", ai: "AI Model", iot: "IoT Node", sn: "Sensor", cl: "Cloud" };

  const cx = 280;
  const cy = 228;
  const nodes = [
    { x: 112, y: 92, label: L.sw },
    { x: 448, y: 92, label: L.ai },
    { x: 84, y: 336, label: L.iot },
    { x: 476, y: 336, label: L.sn },
    { x: 280, y: 48, label: L.cl },
  ];

  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

  return (
    <svg
      className="hero-visual"
      viewBox="0 0 560 440"
      role="img"
      aria-label={ar ? "رسم توضيحي للأنظمة المترابطة" : "Illustration of connected engineering systems"}
    >
      <defs>
        <pattern id="hv-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(25,167,206,0.10)" />
        </pattern>
        <radialGradient id="hv-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(25,167,206,0.16)" />
          <stop offset="100%" stopColor="rgba(25,167,206,0)" />
        </radialGradient>
      </defs>

      <rect width="560" height="440" fill="url(#hv-dots)" rx="22" />
      <circle cx={cx} cy={cy} r="150" fill="url(#hv-glow)" />

      {/* orbit rings */}
      <circle cx={cx} cy={cy} r="112" fill="none" stroke="rgba(25,167,206,0.14)" strokeDasharray="5 7" />
      <circle cx={cx} cy={cy} r="168" fill="none" stroke="rgba(25,167,206,0.08)" strokeDasharray="3 9" />

      {/* links */}
      {nodes.map((n) => (
        <line
          key={n.label}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke="rgba(25,167,206,0.35)"
          strokeWidth="1.5"
        />
      ))}

      {/* travelling pulses */}
      <circle className="pulse" cx="196" cy="160" r="4" fill="#0B132B" />
      <circle className="pulse pulse-2" cx="364" cy="160" r="4" fill="#0B132B" />
      <circle className="pulse pulse-3" cx="182" cy="282" r="4" fill="#0B132B" />

      {/* core */}
      <polygon points={hex(66)} fill="rgba(255,255,255,0.92)" stroke="#06B6D4" strokeWidth="2" />
      <polygon points={hex(52)} fill="none" stroke="rgba(25,167,206,0.35)" strokeWidth="1" />
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="34" fontWeight="800" fill="#0B132B" fontFamily="Inter, sans-serif">
        S
      </text>

      {/* satellite nodes */}
      {nodes.map((n) => (
        <g key={n.label}>
          <rect
            x={n.x - 52}
            y={n.y - 17}
            width="104"
            height="34"
            rx="9"
            fill="rgba(255,255,255,0.94)"
            stroke="rgba(25,167,206,0.55)"
            strokeWidth="1.2"
          />
          <circle cx={n.x - 52} cy={n.y} r="3" fill="#06B6D4" />
          <text
            x={n.x + 4}
            y={n.y + 4.5}
            textAnchor="middle"
            fontSize={ar ? 12.5 : 12}
            fontWeight="600"
            fill="#1E293B"
            fontFamily={ar ? "'IBM Plex Sans Arabic', sans-serif" : "Inter, sans-serif"}
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* corner ticks */}
      {[
        [24, 24],
        [536, 24],
        [24, 416],
        [536, 416],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} stroke="rgba(25,167,206,0.4)" strokeWidth="1.5">
          <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
          <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
        </g>
      ))}
    </svg>
  );
}
