import { NextRequest } from "next/server";

export type BotClassification =
  | "AUTOMATION"
  | "SCRAPER"
  | "DATACENTER"
  | "HEADER_ANOMALY"
  | "BURST_FLOOD"
  | "SOCIAL_CRAWLER"
  | "NONE";

export interface BotDetectionResult {
  isBot: boolean;
  botType: BotClassification;
  isSocialCrawler: boolean;
  reason?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  checkDurationMs: number;
  needsJsChallenge?: boolean;
}

export interface BotProtectionConfig {
  enabled: boolean;
  strictMode: boolean;
  blockDatacenters: boolean;
  checkHeaders: boolean;
  action: "403_BLOCK" | "FALLBACK_REDIRECT" | "SILENT_DROP";
  jsChallengeSuspicious: boolean;
}

// 1. Social Preview Crawlers (WhatsApp, Facebook, Twitter/X, Telegram, Slack, LinkedIn, etc.)
// These require OpenGraph meta tags for preview generation, but MUST NOT be redirected to destination.
const SOCIAL_CRAWLER_REGEX =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|SkypeUriPreview|Pinterest|redditbot|vkShare|Applebot|Google-PageRenderer/i;

// 2. Headless Browsers, Automation Frameworks & Driver Tools
const HEADLESS_AUTOMATION_REGEX =
  /HeadlessChrome|PhantomJS|Selenium|WebDriver|nightwatch|puppeteer|playwright|casperjs|cypress|electron|splash|rhino|htmlunit/i;

// 3. HTTP Libraries, Command-Line Utilities & Scrapers
const HTTP_LIBRARIES_REGEX =
  /curl|wget|httpie|libcurl|python-requests|aiohttp|httpx|urllib|scrapy|mechanize|beautifulsoup|axios|node-fetch|got|superagent|undici|go-http-client|okhttp|java\/|apache-httpclient|libwww-perl|php\/|guzzle|faraday|ruby|rest-client|dart\/|postman|insomnia|packethost|tiny-http/i;

// 4. Commercial Web Scrapers, SEO Bots & AI Crawlers
const WEB_SCRAPERS_REGEX =
  /semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt-user|claudebot|anthropic-ai|cohere-ai|diffbot|perplexitybot|screaming frog|blexbot|megaindex|yandexbot|baiduspider|seokicks|sogou|mail\.ru_bot/i;

// 5. Malicious Network Vulnerability Scanners & Probes
const SECURITY_SCANNERS_REGEX =
  /zgrab|nmap|censys|shodan|masscan|nikto|sqlmap|nuclei|dirbuster|gobuster|wpscan|openvas|nessus|qualys|acunetix/i;

// 6. Cloud Datacenter & Hosting CIDR Ranges (IPv4 fast integer bitmask matching)
// These represent top cloud networks where automated bots and scrapers operate:
// AWS, Google Cloud, Microsoft Azure, DigitalOcean, Hetzner, OVH, Linode, Vultr, Oracle Cloud
interface IPRange {
  mask: number;
  network: number;
  name: string;
}

function ipToInt(ip: string): number {
  const parts = ip.split(".");
  if (parts.length !== 4) return 0;
  return (
    ((parseInt(parts[0], 10) << 24) |
      (parseInt(parts[1], 10) << 16) |
      (parseInt(parts[2], 10) << 8) |
      parseInt(parts[3], 10)) >>>
    0
  );
}

function parseCidr(cidr: string, name: string): IPRange | null {
  const [ipStr, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  if (!ipStr || isNaN(bits) || bits < 0 || bits > 32) return null;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const network = (ipToInt(ipStr) & mask) >>> 0;
  return { mask, network, name };
}

// Well-known high-density datacenter subnets
const DATACENTER_CIDRS: Array<[string, string]> = [
  // DigitalOcean
  ["138.68.0.0/16", "DigitalOcean"],
  ["138.197.0.0/16", "DigitalOcean"],
  ["159.203.0.0/16", "DigitalOcean"],
  ["159.89.0.0/16", "DigitalOcean"],
  ["165.227.0.0/16", "DigitalOcean"],
  ["167.99.0.0/16", "DigitalOcean"],
  ["178.62.0.0/16", "DigitalOcean"],
  ["188.166.0.0/16", "DigitalOcean"],
  ["206.189.0.0/16", "DigitalOcean"],
  ["209.97.128.0/17", "DigitalOcean"],
  ["104.248.0.0/16", "DigitalOcean"],
  ["143.198.0.0/16", "DigitalOcean"],
  ["146.190.0.0/16", "DigitalOcean"],
  ["164.90.128.0/17", "DigitalOcean"],
  // Hetzner
  ["88.99.0.0/16", "Hetzner"],
  ["144.76.0.0/16", "Hetzner"],
  ["148.251.0.0/16", "Hetzner"],
  ["159.69.0.0/16", "Hetzner"],
  ["168.119.0.0/16", "Hetzner"],
  ["78.46.0.0/15", "Hetzner"],
  ["94.130.0.0/16", "Hetzner"],
  ["116.202.0.0/15", "Hetzner"],
  ["135.181.0.0/16", "Hetzner"],
  ["138.201.0.0/16", "Hetzner"],
  ["65.108.0.0/15", "Hetzner"],
  ["65.21.0.0/16", "Hetzner"],
  // OVH
  ["51.68.0.0/15", "OVH"],
  ["51.75.0.0/16", "OVH"],
  ["51.77.0.0/16", "OVH"],
  ["51.83.0.0/16", "OVH"],
  ["51.89.0.0/16", "OVH"],
  ["54.36.0.0/15", "OVH"],
  ["147.135.0.0/16", "OVH"],
  ["149.56.0.0/16", "OVH"],
  ["158.69.0.0/16", "OVH"],
  ["167.114.0.0/16", "OVH"],
  ["198.245.48.0/20", "OVH"],
  ["217.182.0.0/16", "OVH"],
  // Linode / Akamai
  ["172.104.0.0/15", "Linode"],
  ["173.255.192.0/18", "Linode"],
  ["178.79.128.0/17", "Linode"],
  ["139.162.0.0/16", "Linode"],
  ["45.33.0.0/16", "Linode"],
  ["45.56.64.0/18", "Linode"],
  ["45.79.0.0/16", "Linode"],
  // Vultr / Choopa
  ["45.32.0.0/16", "Vultr"],
  ["45.63.0.0/16", "Vultr"],
  ["45.76.0.0/16", "Vultr"],
  ["45.77.0.0/16", "Vultr"],
  ["66.42.32.0/19", "Vultr"],
  ["108.61.0.0/16", "Vultr"],
  ["149.28.0.0/16", "Vultr"],
  ["207.246.64.0/18", "Vultr"],
  ["217.69.0.0/16", "Vultr"],
  // AWS (Amazon Cloud core subnets)
  ["3.0.0.0/9", "Amazon AWS"],
  ["3.128.0.0/9", "Amazon AWS"],
  ["13.32.0.0/15", "Amazon AWS"],
  ["13.56.0.0/14", "Amazon AWS"],
  ["18.144.0.0/15", "Amazon AWS"],
  ["18.156.0.0/14", "Amazon AWS"],
  ["18.160.0.0/15", "Amazon AWS"],
  ["18.184.0.0/14", "Amazon AWS"],
  ["18.192.0.0/12", "Amazon AWS"],
  ["18.208.0.0/13", "Amazon AWS"],
  ["18.216.0.0/14", "Amazon AWS"],
  ["18.224.0.0/13", "Amazon AWS"],
  ["52.0.0.0/11", "Amazon AWS"],
  ["52.32.0.0/11", "Amazon AWS"],
  ["54.0.0.0/11", "Amazon AWS"],
  ["54.64.0.0/11", "Amazon AWS"],
  ["54.128.0.0/10", "Amazon AWS"],
  ["54.192.0.0/12", "Amazon AWS"],
  // Google Cloud (GCP)
  ["34.64.0.0/11", "Google Cloud"],
  ["34.96.0.0/11", "Google Cloud"],
  ["34.128.0.0/10", "Google Cloud"],
  ["35.184.0.0/13", "Google Cloud"],
  ["35.192.0.0/12", "Google Cloud"],
  ["35.208.0.0/12", "Google Cloud"],
  ["35.224.0.0/12", "Google Cloud"],
  ["35.240.0.0/13", "Google Cloud"],
  // Microsoft Azure
  ["20.33.0.0/16", "Microsoft Azure"],
  ["20.40.0.0/13", "Microsoft Azure"],
  ["20.48.0.0/12", "Microsoft Azure"],
  ["20.64.0.0/10", "Microsoft Azure"],
  ["20.128.0.0/16", "Microsoft Azure"],
  ["20.184.0.0/13", "Microsoft Azure"],
  ["20.192.0.0/10", "Microsoft Azure"],
  ["40.64.0.0/10", "Microsoft Azure"],
  ["40.128.0.0/11", "Microsoft Azure"],
  ["51.103.0.0/16", "Microsoft Azure"],
  ["51.104.0.0/15", "Microsoft Azure"],
  ["51.140.0.0/14", "Microsoft Azure"],
  ["52.136.0.0/13", "Microsoft Azure"],
  ["52.144.0.0/12", "Microsoft Azure"],
  ["52.160.0.0/11", "Microsoft Azure"],
  ["52.224.0.0/11", "Microsoft Azure"],
];

const COMPILED_RANGES: IPRange[] = DATACENTER_CIDRS.map(([cidr, name]) =>
  parseCidr(cidr, name)
).filter((r): r is IPRange => r !== null);

function checkDatacenterIp(ip: string): string | null {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return null;
  const cleanIp = ip.split(",")[0].trim();
  const intVal = ipToInt(cleanIp);
  if (!intVal) return null;

  for (let i = 0; i < COMPILED_RANGES.length; i++) {
    const r = COMPILED_RANGES[i];
    if (((intVal & r.mask) >>> 0) === r.network) {
      return r.name;
    }
  }
  return null;
}

// 7. Fast In-Memory Rate Limiting for Burst / Flood Protection (< 0.05ms)
const ipRequestWindow = new Map<string, { count: number; resetAt: number }>();
let lastCleanTime = Date.now();

function checkBurstFlood(ip: string): boolean {
  const now = Date.now();
  // Periodic cleanup every 60s
  if (now - lastCleanTime > 60000) {
    ipRequestWindow.forEach((v, k) => {
      if (now > v.resetAt) ipRequestWindow.delete(k);
    });
    lastCleanTime = now;
  }

  const record = ipRequestWindow.get(ip);
  if (!record || now > record.resetAt) {
    ipRequestWindow.set(ip, { count: 1, resetAt: now + 2000 }); // 2-second sliding window
    return false;
  }

  record.count += 1;
  // If more than 15 requests in 2 seconds from the same IP, trigger burst bot block
  return record.count > 15;
}

/**
 * Ultra-Fast Bot Detection Engine
 * Zero external calls. Executes in < 0.1ms.
 */
export function detectBot(
  request: NextRequest,
  userAgent: string,
  rawIp: string,
  config?: Partial<BotProtectionConfig>
): BotDetectionResult {
  const startTime = performance.now();
  const ua = (userAgent || "").trim();
  const cleanIp = rawIp.split(",")[0].trim();

  const cfg: BotProtectionConfig = {
    enabled: config?.enabled ?? true,
    strictMode: config?.strictMode ?? true,
    blockDatacenters: config?.blockDatacenters ?? true,
    checkHeaders: config?.checkHeaders ?? true,
    action: config?.action ?? "403_BLOCK",
    jsChallengeSuspicious: config?.jsChallengeSuspicious ?? true,
  };

  if (!cfg.enabled) {
    return {
      isBot: false,
      botType: "NONE",
      isSocialCrawler: false,
      confidence: "LOW",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 1: Social Media Preview Crawlers
  // Must be recognized immediately so openGraph tags are rendered WITHOUT redirecting!
  if (SOCIAL_CRAWLER_REGEX.test(ua)) {
    return {
      isBot: true,
      botType: "SOCIAL_CRAWLER",
      isSocialCrawler: true,
      reason: "social_media_preview_crawler",
      confidence: "HIGH",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 2: Missing or Suspiciously Short User-Agent
  if (!ua || ua.length < 10) {
    return {
      isBot: true,
      botType: "AUTOMATION",
      isSocialCrawler: false,
      reason: "empty_or_malformed_user_agent",
      confidence: "HIGH",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 3: Automated Scrapers & Frameworks
  if (HEADLESS_AUTOMATION_REGEX.test(ua)) {
    return {
      isBot: true,
      botType: "AUTOMATION",
      isSocialCrawler: false,
      reason: "headless_browser_automation_detected",
      confidence: "HIGH",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 4: HTTP Script Libraries (curl, requests, axios, go, okhttp, etc.)
  if (HTTP_LIBRARIES_REGEX.test(ua)) {
    return {
      isBot: true,
      botType: "SCRAPER",
      isSocialCrawler: false,
      reason: "script_http_client_detected",
      confidence: "HIGH",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 5: Web Scrapers & Commercial Spiders
  if (WEB_SCRAPERS_REGEX.test(ua)) {
    return {
      isBot: true,
      botType: "SCRAPER",
      isSocialCrawler: false,
      reason: "commercial_crawler_spider_detected",
      confidence: "HIGH",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 6: Vulnerability & Exploitation Scanners
  if (SECURITY_SCANNERS_REGEX.test(ua)) {
    return {
      isBot: true,
      botType: "AUTOMATION",
      isSocialCrawler: false,
      reason: "security_vulnerability_scanner",
      confidence: "HIGH",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 7: Burst Flood / Rapid Automated Clicks (> 15 reqs in 2s)
  if (checkBurstFlood(cleanIp)) {
    return {
      isBot: true,
      botType: "BURST_FLOOD",
      isSocialCrawler: false,
      reason: "burst_rate_flood_limit_exceeded",
      confidence: "HIGH",
      checkDurationMs: performance.now() - startTime,
    };
  }

  // Check 8: Cloud Datacenter & Server Hosting Subnets
  if (cfg.blockDatacenters) {
    const dcName = checkDatacenterIp(cleanIp);
    if (dcName) {
      return {
        isBot: true,
        botType: "DATACENTER",
        isSocialCrawler: false,
        reason: `datacenter_cloud_traffic_detected_${dcName.toLowerCase().replace(/\s+/g, "_")}`,
        confidence: "HIGH",
        checkDurationMs: performance.now() - startTime,
      };
    }
  }

  // Check 9: Modern Browser Header Integrity (Strict Mode)
  if (cfg.checkHeaders) {
    const acceptLang = request.headers.get("accept-language");
    const accept = request.headers.get("accept") || "";
    const secChUa = request.headers.get("sec-ch-ua");
    const secChUaPlatform = request.headers.get("sec-ch-ua-platform");

    // Real human desktop & mobile browsers always send accept-language when opening links.
    // Raw curl/python/bots rarely send accept-language.
    if (!acceptLang) {
      // Check if it claims to be a modern desktop browser (Mozilla/Chrome/Safari)
      if (
        /Mozilla|Chrome|Safari|Edge|Firefox/i.test(ua) &&
        !/Mobile.*Safari/i.test(ua)
      ) {
        return {
          isBot: true,
          botType: "HEADER_ANOMALY",
          isSocialCrawler: false,
          reason: "missing_accept_language_header_on_browser_agent",
          confidence: "HIGH",
          checkDurationMs: performance.now() - startTime,
        };
      }
    }

    // Client Hints inconsistency:
    // If sec-ch-ua-platform claims "Linux" but User-Agent claims "Windows", or vice versa
    if (secChUaPlatform) {
      const cleanPlatform = secChUaPlatform.replace(/"/g, "").toLowerCase();
      const uaLower = ua.toLowerCase();
      if (
        cleanPlatform === "windows" &&
        !uaLower.includes("windows") &&
        !uaLower.includes("win64")
      ) {
        return {
          isBot: true,
          botType: "HEADER_ANOMALY",
          isSocialCrawler: false,
          reason: "client_hints_platform_mismatch",
          confidence: "HIGH",
          checkDurationMs: performance.now() - startTime,
        };
      }
    }

    // Non-GET requests (e.g. bots sending HEAD/POST to discover endpoints)
    if (request.method !== "GET") {
      return {
        isBot: true,
        botType: "AUTOMATION",
        isSocialCrawler: false,
        reason: `invalid_request_method_${request.method.toLowerCase()}`,
        confidence: "HIGH",
        checkDurationMs: performance.now() - startTime,
      };
    }
  }

  // Clean Human Visitor!
  return {
    isBot: false,
    botType: "NONE",
    isSocialCrawler: false,
    confidence: "LOW",
    checkDurationMs: performance.now() - startTime,
  };
}

/**
 * Modern High-Tech 403 Forbidden Shield Block Page
 * Rendered when a bot is detected.
 * Crucial: NEVER leaks or exposes destinationUrl!
 */
export function renderBotBlockedResponse(reason?: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>403 Forbidden | Access Restricted</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0b0f19;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      padding: 36px 32px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .shield-icon {
      width: 64px;
      height: 64px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      color: #ef4444;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 9999px;
      font-size: 11px;
      font-family: monospace;
      color: #f87171;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #1f2937;
      padding-top: 18px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="shield-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h1>403 - Direct Access Restricted</h1>
    <p>Automated requests, scrapers, and datacenter proxy connections are restricted on this tracking link to protect advertiser integrity.</p>
    <div class="badge">Shield Code: ${reason || "BOT_DETECTED"}</div>
    <div class="footer">
      Protected by <strong>Traffic Track Shield</strong> • Zero-Tolerance Fraud Prevention
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 403,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * Social Media OpenGraph Card Response (WhatsApp, Facebook, Twitter, Telegram, LinkedIn)
 * Renders ONLY the preview tags.
 * DOES NOT issue auto-redirects or meta refresh so bots cannot scrape destination links!
 */
export function renderSocialPreviewResponse(
  title: string,
  desc: string,
  image: string,
  canonicalUrl: string
): Response {
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(desc);
  const escapedImage = image ? escapeHtml(image) : "";
  const escapedUrl = escapeHtml(canonicalUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapedTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDesc}" />
  ${escapedImage ? `<meta property="og:image" content="${escapedImage}" />` : ""}
  <meta property="og:url" content="${escapedUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDesc}" />
  ${escapedImage ? `<meta name="twitter:image" content="${escapedImage}" />` : ""}
  <!-- NOTICE: Automated preview crawlers are served preview metadata only -->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; margin: 0;">
  <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 440px; width: 100%; padding: 28px; text-align: center;">
    ${
      escapedImage
        ? `<img src="${escapedImage}" alt="Preview" style="max-width: 100%; border-radius: 8px; margin-bottom: 16px; max-height: 200px; object-fit: cover;" />`
        : ""
    }
    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${escapedTitle}</h2>
    <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">${escapedDesc}</p>
    <div style="font-size: 11px; color: #64748b;">
      Tap link directly from your mobile or desktop browser to view.
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
