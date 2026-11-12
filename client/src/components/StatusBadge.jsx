export default function StatusBadge({ status }) {
  return <span className={`badge-status badge-${status}`}>{status?.[0]?.toUpperCase()}{status?.slice(1)}</span>;
}
