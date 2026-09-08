import { useId } from "react";

/**
 * MeltCookies official brand logo:
 * cream circular badge + bitten-cookie line art + MELT COOKIES wordmark.
 */
export default function CookieLogo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const biteId = `melt-bite-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <mask id={biteId}>
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <circle cx="62.5" cy="21.5" r="6.2" fill="black" />
          <circle cx="60.5" cy="32.5" r="5.6" fill="black" />
        </mask>
      </defs>

      {/* Cream badge */}
      <circle cx="50" cy="50" r="49" fill="#F9E9D2" />
      <circle cx="50" cy="50" r="48.2" stroke="#EAD3B4" strokeWidth="1.2" fill="none" />

      {/* Bitten cookie line art (bite carved on the upper right) */}
      <g mask={`url(#${biteId})`}>
        <circle
          cx="49"
          cy="27.5"
          r="12.5"
          stroke="#4A2C17"
          strokeWidth="2.6"
          fill="none"
        />
      </g>
      {/* Chocolate chips */}
      <circle cx="44" cy="21.5" r="1.8" fill="#4A2C17" />
      <circle cx="52.5" cy="20" r="1.5" fill="#4A2C17" />
      <circle cx="43.5" cy="30.5" r="1.6" fill="#4A2C17" />
      <circle cx="51" cy="34.5" r="1.7" fill="#4A2C17" />
      <circle cx="55" cy="28" r="1.3" fill="#4A2C17" />

      {/* Wordmark */}
      <text
        x="50"
        y="67"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="21"
        fontWeight="700"
        letterSpacing="1.5"
        fill="#4A2C17"
      >
        MELT
      </text>
      <text
        x="50"
        y="80.5"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontSize="7.4"
        fontWeight="600"
        letterSpacing="2.8"
        fill="#4A2C17"
      >
        COOKIES
      </text>
    </svg>
  );
}
