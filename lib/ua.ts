import { UAParser } from "ua-parser-js";

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: "Mobile" | "Desktop" | "Tablet" | "Other";
  isBot: boolean;
  botName?: string;
}

const CRAWLER_PATTERNS = [
  { name: "Facebook Crawler", regex: /facebookexternalhit|Facebot/i },
  { name: "TwitterBot", regex: /Twitterbot/i },
  { name: "WhatsApp", regex: /WhatsApp/i },
  { name: "LinkedInBot", regex: /LinkedInBot/i },
  { name: "TelegramBot", regex: /TelegramBot/i },
  { name: "Slackbot", regex: /Slackbot/i },
  { name: "GoogleBot", regex: /Googlebot/i },
  { name: "BingBot", regex: /bingbot/i },
  { name: "DiscordBot", regex: /Discordbot/i },
  { name: "Generic Bot", regex: /bot|crawler|spider|curl|wget|python|postman/i },
];

export function isSocialCrawler(uaString: string): boolean {
  if (!uaString) return false;
  return /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot/i.test(
    uaString
  );
}

export function parseUserAgent(uaString: string = ""): ParsedUserAgent {
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  // Check Bot
  for (const bot of CRAWLER_PATTERNS) {
    if (bot.regex.test(uaString)) {
      return {
        browser: bot.name,
        browserVersion: "",
        os: "Bot",
        osVersion: "",
        deviceType: "Other",
        isBot: true,
        botName: bot.name,
      };
    }
  }

  // Check In-App Browsers
  let browser = result.browser.name || "Unknown";
  if (/FB_IAB|FB4A|FBAV|FBAN/i.test(uaString)) {
    browser = "Facebook In-App Browser";
  } else if (/Instagram/i.test(uaString)) {
    browser = "Instagram In-App Browser";
  } else if (/TikTok/i.test(uaString)) {
    browser = "TikTok In-App Browser";
  }

  // OS
  const os = result.os.name || "Other";

  // Device Type
  let deviceType: "Mobile" | "Desktop" | "Tablet" | "Other" = "Desktop";
  const rawType = result.device.type;

  if (rawType === "mobile" || /Android|iPhone|iPod/i.test(uaString)) {
    deviceType = "Mobile";
  } else if (rawType === "tablet" || /iPad/i.test(uaString)) {
    deviceType = "Tablet";
  } else if (rawType === "smarttv" || rawType === "wearable" || rawType === "embedded") {
    deviceType = "Other";
  } else {
    deviceType = "Desktop";
  }

  return {
    browser,
    browserVersion: result.browser.version || "",
    os,
    osVersion: result.os.version || "",
    deviceType,
    isBot: false,
  };
}
