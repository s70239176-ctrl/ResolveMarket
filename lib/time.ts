export function deadlineLabel(deadline: number) {
  if (!deadline) return "No deadline";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(deadline * 1000));
}

export function timeLeft(deadline: number) {
  const seconds = Math.max(0, deadline - Math.floor(Date.now() / 1000));
  if (seconds === 0) return "Closed";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function truncateAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
