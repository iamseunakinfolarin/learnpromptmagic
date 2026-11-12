/** "Play this one again", shown only where the station offers a replay. */
export default function ReplayButton({ onReplay }: { onReplay?: () => void }) {
  if (!onReplay) return null;
  return (
    <button type="button" className="linkish" onClick={onReplay}>
      Play this one again
    </button>
  );
}
