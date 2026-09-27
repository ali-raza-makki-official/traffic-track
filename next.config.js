const path = require("path");

// Automatically assemble DATABASE_URL from separate environment variables if not provided
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const host = process.env.DB_HOST || "srv1322.hstgr.io";
  const port = process.env.DB_PORT || "3306";
  const user = process.env.DB_USER || "";
  const password = process.env.DB_PASSWORD || "";
  const name = process.env.DB_NAME || "";
  const encodedPassword = encodeURIComponent(password);
  process.env.DATABASE_URL = `mysql://${user}:${encodedPassword}@${host}:${port}/${name}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;

