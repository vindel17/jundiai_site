import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Só vale no `next dev`: deixa o celular na mesma rede local carregar o JavaScript da página. */
  allowedDevOrigins: ["192.168.*.*", "172.16.*.*", "10.*.*.*"],
};

export default nextConfig;
