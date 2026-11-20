export function getBangkokNow() {
  const now = new Date();
  const bangkokString = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
  const bkkDate = new Date(bangkokString);

  const year = bkkDate.getFullYear();
  const month = String(bkkDate.getMonth() + 1).padStart(2, "0");
  const day = String(bkkDate.getDate()).padStart(2, "0");
  const hours = String(bkkDate.getHours()).padStart(2, "0");
  const minutes = String(bkkDate.getMinutes()).padStart(2, "0");
  const seconds = String(bkkDate.getSeconds()).padStart(2, "0");

  return {
    iso: now.toISOString(),
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hours}:${minutes}:${seconds}`,
    dayOfWeek: bkkDate.getDay(),
  };
}

export function formatThaiDate(dateInput: string | Date, includeTime = false): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
  return new Intl.DateTimeFormat("th-TH", options).format(date);
}
