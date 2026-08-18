import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Evita streaming metadata → mismatch MetadataWrapper (div hidden vs whitespace)
  htmlLimitedBots: /.*/,
};

export default nextConfig;
