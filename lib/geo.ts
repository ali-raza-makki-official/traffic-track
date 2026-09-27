export interface GeoLocation {
  countryCode: string;
  countryName: string;
  region: string;
  city: string;
  timezone: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  PK: "Pakistan",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  IN: "India",
  OM: "Oman",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  MY: "Malaysia",
  TR: "Turkey",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  AU: "Australia",
  BD: "Bangladesh",
  ID: "Indonesia",
  EG: "Egypt",
  NG: "Nigeria",
  ZA: "South Africa",
  BR: "Brazil",
};

// In-memory cache to prevent redundant IP queries
const ipGeoCache = new Map<string, GeoLocation>();

export async function lookupIp(
  ip: string,
  requestHeaders?: Headers | Record<string, string | null>
): Promise<GeoLocation> {
  const getHeader = (key: string): string | null => {
    if (!requestHeaders) return null;
    if (typeof (requestHeaders as Headers).get === "function") {
      return (requestHeaders as Headers).get(key);
    }
    return (requestHeaders as Record<string, string | null>)[key] || null;
  };

  // 1. Check Edge CDN Headers (Cloudflare / Hostinger)
  const cfCountry = getHeader("cf-ipcountry") || getHeader("x-country-code");
  const cfCity = getHeader("cf-ipcity") || getHeader("x-city");
  const cfRegion = getHeader("cf-region") || getHeader("x-region");

  if (cfCountry && cfCountry.length === 2 && cfCountry !== "XX" && cfCountry !== "T1") {
    const code = cfCountry.toUpperCase();
    return {
      countryCode: code,
      countryName: COUNTRY_NAMES[code] || code,
      region: cfRegion || "Unknown",
      city: cfCity || "Unknown",
      timezone: code === "PK" ? "Asia/Karachi" : "UTC",
    };
  }

  // 2. Normalize local / private IP
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip === "localhost"
  ) {
    return {
      countryCode: "PK",
      countryName: "Pakistan",
      region: "Punjab",
      city: "Lahore",
      timezone: "Asia/Karachi",
    };
  }

  const cleanIp = ip.split(",")[0].trim();

  // 3. Check memory cache
  if (ipGeoCache.has(cleanIp)) {
    return ipGeoCache.get(cleanIp)!;
  }

  // 4. Query fast IP API (handles both IPv4 and IPv6) with 1.5s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400);

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,country,countryCode,regionName,city,timezone`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "success") {
        const result: GeoLocation = {
          countryCode: data.countryCode || "Other",
          countryName: data.country || "Unknown",
          region: data.regionName || "Unknown",
          city: data.city || "Unknown",
          timezone: data.timezone || "UTC",
        };
        // Cache up to 10,000 entries
        if (ipGeoCache.size > 10000) ipGeoCache.clear();
        ipGeoCache.set(cleanIp, result);
        return result;
      }
    }
  } catch {
    // Network / abort error - continue to fallback
  }

  // Fallback for Pakistan IP prefixes (Jazz, Zong, Nayatel, PTCL IPv6 & IPv4)
  if (
    cleanIp.startsWith("2407:d000:") ||
    cleanIp.startsWith("2400:adc0:") ||
    cleanIp.startsWith("2404:3100:") ||
    cleanIp.startsWith("39.32.") ||
    cleanIp.startsWith("39.34.") ||
    cleanIp.startsWith("39.35.") ||
    cleanIp.startsWith("39.37.") ||
    cleanIp.startsWith("39.38.") ||
    cleanIp.startsWith("39.40.") ||
    cleanIp.startsWith("39.41.") ||
    cleanIp.startsWith("39.44.") ||
    cleanIp.startsWith("39.45.") ||
    cleanIp.startsWith("39.50.") ||
    cleanIp.startsWith("39.51.") ||
    cleanIp.startsWith("182.176.") ||
    cleanIp.startsWith("182.177.") ||
    cleanIp.startsWith("182.178.") ||
    cleanIp.startsWith("182.180.") ||
    cleanIp.startsWith("182.185.") ||
    cleanIp.startsWith("182.186.") ||
    cleanIp.startsWith("182.191.") ||
    cleanIp.startsWith("202.163.") ||
    cleanIp.startsWith("119.160.") ||
    cleanIp.startsWith("175.107.") ||
    cleanIp.startsWith("110.36.") ||
    cleanIp.startsWith("110.37.") ||
    cleanIp.startsWith("110.38.") ||
    cleanIp.startsWith("110.39.")
  ) {
    const pkResult: GeoLocation = {
      countryCode: "PK",
      countryName: "Pakistan",
      region: "Punjab",
      city: "Lahore",
      timezone: "Asia/Karachi",
    };
    ipGeoCache.set(cleanIp, pkResult);
    return pkResult;
  }

  const defaultResult: GeoLocation = {
    countryCode: "Other",
    countryName: "Unknown",
    region: "Unknown",
    city: "Unknown",
    timezone: "UTC",
  };
  return defaultResult;
}
