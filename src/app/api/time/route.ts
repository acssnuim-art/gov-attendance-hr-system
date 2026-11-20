import { NextResponse } from "next/server";
import { getBangkokNow, formatThaiDate } from "@/lib/thai-date";

export const dynamic = "force-dynamic";

export async function GET() {
  const bkk = getBangkokNow();
  const thaiDateFull = formatThaiDate(new Date(), false);
  const thaiDateTimeFull = formatThaiDate(new Date(), true);

  return NextResponse.json({
    timezone: "Asia/Bangkok",
    date: bkk.dateStr,
    time: bkk.timeStr,
    iso: bkk.iso,
    dayOfWeek: bkk.dayOfWeek,
    thaiDateFull,
    thaiDateTimeFull,
  });
}
