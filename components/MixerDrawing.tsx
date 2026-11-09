/** The kitchen assistant, drawn as a stand mixer. */
export default function MixerDrawing() {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="The kitchen assistant, drawn as a stand mixer"
    >
      <rect className="mx-body" x="12" y="98" width="96" height="13" rx="6" />
      <rect className="mx-body" x="78" y="46" width="22" height="56" rx="8" />
      <path className="mx-line" d="M46 58v14" />
      <path className="mx-bowl" d="M20 72h52c0 16-10 26-26 26S20 88 20 72z" />
      <path className="mx-line" d="M17 72h58" />
      <rect className="mx-body" x="20" y="26" width="86" height="32" rx="16" />
      <circle className="mx-eye" cx="40" cy="41" r="3.6" />
      <circle className="mx-eye" cx="55" cy="41" r="3.6" />
      <circle className="mx-eye" cx="89" cy="70" r="3.2" />
    </svg>
  );
}
