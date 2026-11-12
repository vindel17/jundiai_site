import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Só vale no `next dev`: deixa o celular na mesma rede local carregar o JavaScript da página. */
  allowedDevOrigins: ["192.168.*.*", "172.16.*.*", "10.*.*.*"],

  /** Links antigos do funil de etiquetas (anúncios, QR Code) levam à reserva, o caminho público atual. */
  async redirects() {
    return [
      { source: "/etiquetas/:path*", destination: "/reserva", permanent: false },
      { source: "/doacao", destination: "/reserva", permanent: false },
      { source: "/doacao/:path*", destination: "/reserva", permanent: false },
    ];
  },
};

export default nextConfig;
