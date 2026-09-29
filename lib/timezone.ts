/**
 * Pakistan Time Zone Utilities (PKT / Asia/Karachi / UTC+5)
 * Handles midnight to midnight (12:00 AM to 11:59:59.999 PM) date ranges.
 */

export function getPakistanTodayRange() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const now = new Date();
  const todayDateStr = formatter.format(now); // "YYYY-MM-DD" in PKT

  const startOfDayPkt = new Date(`${todayDateStr}T00:00:00+05:00`);
  const endOfDayPkt = new Date(`${todayDateStr}T23:59:59.999+05:00`);

  const yesterdayDate = new Date(startOfDayPkt.getTime() - 12 * 3600 * 1000);
  const yesterdayDateStr = formatter.format(yesterdayDate);

  const startOfYesterdayPkt = new Date(`${yesterdayDateStr}T00:00:00+05:00`);
  const endOfYesterdayPkt = new Date(`${yesterdayDateStr}T23:59:59.999+05:00`);

  return {
    todayDateStr,
    yesterdayDateStr,
    startOfDayPkt,
    endOfDayPkt,
    startOfYesterdayPkt,
    endOfYesterdayPkt,
  };
}
