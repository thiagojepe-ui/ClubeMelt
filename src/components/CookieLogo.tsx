import { useId } from "react";

/** MeltCookies brand logo — a soft clay-style chocolate chip cookie. */
export default function CookieLogo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const bodyId = `cookie-body-${uid}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={bodyId} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#F4CEA0" />
          <stop offset="55%" stopColor="#E2AA72" />
          <stop offset="100%" stopColor="#C98A58" />
        </radialGradient>
      </defs>
      {/* Cookie body */}
      <circle cx="32" cy="32" r="29" fill={`url(#${bodyId})`} />
      <circle
        cx="32"
        cy="32"
        r="29"
        stroke="#A96A3A"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <circle cx="32" cy="32" r="24.5" stroke="#A96A3A" strokeOpacity="0.12" strokeWidth="1.5" />
      {/* Chocolate chips */}
      <circle cx="21" cy="19" r="4.2" fill="#5B3A24" />
      <circle cx="41.5" cy="16" r="3.5" fill="#5B3A24" />
      <circle cx="32" cy="30" r="4.4" fill="#4F3121" />
      <circle cx="17" cy="37" r="3.2" fill="#5B3A24" />
      <circle cx="44.5" cy="33" r="4" fill="#4F3121" />
      <circle cx="25.5" cy="46" r="3.4" fill="#5B3A24" />
      <circle cx="38.5" cy="47.5" r="3" fill="#4F3121" />
      {/* Soft highlight */}
      <ellipse cx="23" cy="17.5" rx="9.5" ry="5" fill="#FFFFFF" opacity="0.28" />
    </svg>
  );
}