export interface TrafficSourceInfo {
  source: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export function detectSource(
  referrer: string = "",
  searchParams: URLSearchParams
): TrafficSourceInfo {
  const utmSource = searchParams.get("utm_source") || undefined;
  const utmMedium = searchParams.get("utm_medium") || undefined;
  const utmCampaign = searchParams.get("utm_campaign") || undefined;
  const explicitSource = searchParams.get("source") || undefined;

  let source = "Direct";

  if (explicitSource?.toLowerCase() === "qr" || utmSource?.toLowerCase() === "qr") {
    source = "QR Code";
  } else if (utmSource) {
    const s = utmSource.toLowerCase();
    if (s.includes("facebook") || s === "fb") source = "Facebook";
    else if (s.includes("instagram") || s === "ig") source = "Instagram";
    else if (s.includes("google")) source = "Google";
    else if (s.includes("whatsapp")) source = "WhatsApp";
    else if (s.includes("telegram")) source = "Telegram";
    else if (s.includes("tiktok")) source = "TikTok";
    else if (s.includes("twitter") || s === "x") source = "Twitter / X";
    else source = utmSource;
  } else if (referrer) {
    try {
      const url = new URL(referrer);
      const host = url.hostname.toLowerCase();

      if (host.includes("facebook.com") || host.includes("fb.me") || host.includes("messenger.com")) {
        source = "Facebook";
      } else if (host.includes("instagram.com")) {
        source = "Instagram";
      } else if (host.includes("whatsapp.com") || host.includes("wa.me")) {
        source = "WhatsApp";
      } else if (host.includes("telegram.org") || host.includes("t.me")) {
        source = "Telegram";
      } else if (host.includes("google.")) {
        source = "Google";
      } else if (host.includes("tiktok.com")) {
        source = "TikTok";
      } else if (host.includes("twitter.com") || host.includes("x.com") || host.includes("t.co")) {
        source = "Twitter / X";
      } else if (host.includes("linkedin.com")) {
        source = "LinkedIn";
      } else if (host.includes("youtube.com")) {
        source = "YouTube";
      } else {
        source = host;
      }
    } catch {
      source = "Other";
    }
  }

  return {
    source,
    referrer: referrer || "Direct",
    utmSource,
    utmMedium,
    utmCampaign,
  };
}
