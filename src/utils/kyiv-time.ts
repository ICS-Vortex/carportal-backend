const KYIV_TIME_ZONE = "Europe/Kyiv";

export function kyivTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KYIV_TIME_ZONE }).format(new Date());
}

export function kyivNowTimeString(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KYIV_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${hour}:${minute}`;
}

export function compareDateStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

export function compareTimeStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => Number(part));

  return hours * 60 + minutes;
}

export function formatMinutesAsTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
