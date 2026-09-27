import { db } from "./db";

export interface AnalyticsFilter {
  userId?: string;
  linkId?: string;
  period?: "today" | "yesterday" | "7d" | "30d" | "90d" | "this_month" | "last_month" | "month_to_date" | "quarter_to_date" | "all" | "custom";
  from?: string; // ISO date string
  to?: string;   // ISO date string
  country?: string;
  city?: string;
  source?: string;
  deviceType?: string;
  os?: string;
}

export function getDateRange(filter: AnalyticsFilter): { start: Date; end: Date } {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filter.period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "7d":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "30d":
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case "90d":
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "month_to_date":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case "quarter_to_date":
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case "custom":
      if (filter.from) start = new Date(filter.from);
      if (filter.to) end = new Date(filter.to);
      break;
    case "all":
    default:
      start = new Date("2020-01-01T00:00:00Z");
      break;
  }

  return { start, end };
}

export async function getAggregatedAnalytics(filter: AnalyticsFilter, isEmployeeView = false) {
  const { start, end } = getDateRange(filter);

  // Build where clause for TrafficEvent
  const where: any = {
    timestampUtc: {
      gte: start,
      lte: end,
    },
    isTest: false,
    isBot: false,
  };

  if (filter.userId) where.userId = filter.userId;
  if (filter.linkId) where.linkId = filter.linkId;
  if (filter.country && filter.country !== "all") where.countryCode = filter.country;
  if (filter.city && filter.city !== "all") where.city = filter.city;
  if (filter.source && filter.source !== "all") where.source = filter.source;
  if (filter.deviceType && filter.deviceType !== "all") where.deviceType = filter.deviceType;
  if (filter.os && filter.os !== "all") where.os = filter.os;

  // Fetch events matching criteria
  const events = await db.trafficEvent.findMany({
    where,
    select: {
      id: true,
      timestampUtc: true,
      countryCode: true,
      countryName: true,
      city: true,
      region: true,
      source: true,
      deviceType: true,
      os: true,
      browser: true,
      isValid: true,
      isBot: true,
      isDuplicate: true,
      isUnique: true,
      userId: true,
      linkId: true,
      user: {
        select: {
          trafficPercentageOverride: true,
        },
      },
    },
    orderBy: { timestampUtc: "desc" },
  });

  // Fetch global credit setting
  const globalSetting = await db.setting.findUnique({
    where: { settingKey: "traffic_credit_percentage" },
  });
  const defaultRate = globalSetting ? parseFloat(globalSetting.settingValue) : 50.0;

  // 1. KPI Totals
  let rawHits = events.length;
  let validVisits = 0;
  let botHits = 0;
  let duplicateHits = 0;
  let uniqueVisitors = 0;
  let creditedClicks = 0;

  // Breakdown dictionaries
  const dailyMap: Record<string, { date: string; raw: number; valid: number; credited: number }> = {};
  const hourlyMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0;

  const dayOfWeekMap: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  const countryMap: Record<string, { code: string; name: string; visits: number; cities: Record<string, number> }> = {};
  const cityMap: Record<string, number> = {};
  const deviceMap: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0, Other: 0 };
  const osMap: Record<string, number> = {};
  const browserMap: Record<string, number> = {};
  const sourceMap: Record<string, number> = {};

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  events.forEach((ev) => {
    if (ev.isBot) botHits++;
    if (ev.isDuplicate) duplicateHits++;
    if (ev.isUnique) uniqueVisitors++;

    const dateKey = ev.timestampUtc.toISOString().split("T")[0];
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { date: dateKey, raw: 0, valid: 0, credited: 0 };
    }
    dailyMap[dateKey].raw++;

    if (ev.isValid) {
      validVisits++;
      dailyMap[dateKey].valid++;

      const rate = ev.user.trafficPercentageOverride ?? defaultRate;
      const creditIncrement = rate / 100;
      dailyMap[dateKey].credited += creditIncrement;

      // Time breakdowns for valid traffic
      const hour = new Date(ev.timestampUtc).getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;

      const dayName = daysOfWeek[new Date(ev.timestampUtc).getDay()];
      dayOfWeekMap[dayName] = (dayOfWeekMap[dayName] || 0) + 1;

      // Location breakdowns
      const cCode = ev.countryCode || "Other";
      const cName = ev.countryName || "Unknown";
      if (!countryMap[cCode]) {
        countryMap[cCode] = { code: cCode, name: cName, visits: 0, cities: {} };
      }
      countryMap[cCode].visits++;

      const city = ev.city && ev.city !== "Unknown" ? ev.city : "Other";
      countryMap[cCode].cities[city] = (countryMap[cCode].cities[city] || 0) + 1;
      cityMap[city] = (cityMap[city] || 0) + 1;

      // Technology breakdowns
      const dev = ev.deviceType || "Other";
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;

      const osName = ev.os || "Other";
      osMap[osName] = (osMap[osName] || 0) + 1;

      const browserName = ev.browser || "Other";
      browserMap[browserName] = (browserMap[browserName] || 0) + 1;

      // Source breakdown
      const src = ev.source || "Direct";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
  });

  // Calculate final credited visits
  const dailyTrends = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      credited: Math.floor(d.credited),
    }));

  creditedClicks = dailyTrends.reduce((sum, d) => sum + d.credited, 0);

  const countries = Object.values(countryMap)
    .map((c) => ({
      code: c.code,
      name: c.name,
      visits: c.visits,
      percentage: validVisits > 0 ? Math.round((c.visits / validVisits) * 100) : 0,
      cities: Object.entries(c.cities)
        .map(([cityName, count]) => ({ city: cityName, visits: count }))
        .sort((a, b) => b.visits - a.visits),
    }))
    .sort((a, b) => b.visits - a.visits);

  const cities = Object.entries(cityMap)
    .map(([city, visits]) => ({
      city,
      visits,
      percentage: validVisits > 0 ? Math.round((visits / validVisits) * 100) : 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  const devices = Object.entries(deviceMap).map(([name, count]) => ({
    name,
    count,
    percentage: validVisits > 0 ? Math.round((count / validVisits) * 100) : 0,
  }));

  const operatingSystems = Object.entries(osMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: validVisits > 0 ? Math.round((count / validVisits) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const browsers = Object.entries(browserMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: validVisits > 0 ? Math.round((count / validVisits) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const sources = Object.entries(sourceMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: validVisits > 0 ? Math.round((count / validVisits) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const hourly = Object.entries(hourlyMap).map(([hour, count]) => ({
    hour: `${parseInt(hour, 10)}:00`,
    count,
  }));

  const dayOfWeek = daysOfWeek.map((day) => ({
    day,
    count: dayOfWeekMap[day] || 0,
  }));

  return {
    kpis: {
      rawHits: isEmployeeView ? undefined : rawHits,
      validVisits: isEmployeeView ? undefined : validVisits,
      botHits: isEmployeeView ? undefined : botHits,
      duplicateHits: isEmployeeView ? undefined : duplicateHits,
      uniqueVisitors: isEmployeeView ? undefined : uniqueVisitors,
      repeatVisits: isEmployeeView ? undefined : Math.max(0, validVisits - uniqueVisitors),
      creditedClicks,
      effectiveRate: defaultRate,
    },
    dailyTrends: dailyTrends.map((d) => ({
      date: d.date,
      raw: isEmployeeView ? undefined : d.raw,
      valid: isEmployeeView ? undefined : d.valid,
      credited: d.credited,
    })),
    hourly,
    dayOfWeek,
    countries,
    cities,
    devices,
    operatingSystems,
    browsers,
    sources,
  };
}
