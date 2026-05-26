/**
 * SVG color-matrix filters approximating common color vision deficiencies.
 * Matrices from Machado, Oliveira & Fernandes (2009).
 */
export function VisionFilters() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        <filter id="vision-protanopia">
          <feColorMatrix
            type="matrix"
            values="0.567 0.433 0     0 0
                    0.558 0.442 0     0 0
                    0     0.242 0.758 0 0
                    0     0     0     1 0"
          />
        </filter>
        <filter id="vision-deuteranopia">
          <feColorMatrix
            type="matrix"
            values="0.625 0.375 0    0 0
                    0.7   0.3   0    0 0
                    0     0.3   0.7  0 0
                    0     0     0    1 0"
          />
        </filter>
        <filter id="vision-tritanopia">
          <feColorMatrix
            type="matrix"
            values="0.95 0.05  0     0 0
                    0    0.433 0.567 0 0
                    0    0.475 0.525 0 0
                    0    0     0     1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
