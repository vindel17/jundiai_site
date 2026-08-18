import type { Metadata } from "next";
import { PedidoFunnel } from "@/components/pedido/pedido-funnel";
import { ProvaSocial } from "@/components/prova-social/prova-social";
import {
  listarAvaliacoesPublicas,
  listarResumosAvaliacao,
  mediaGeral,
} from "@/lib/avaliacoes";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Comprar uniforme",
  description: `Monte o pedido do uniforme escolar da rede municipal de ${SITE.city}: escolha as peças, o tamanho e receba em casa.`,
  alternates: { canonical: "/comprar" },
};

export default async function ComprarPage() {
  const [avaliacoes, resumos] = await Promise.all([
    listarAvaliacoesPublicas(),
    listarResumosAvaliacao(),
  ]);
  const { media, total } = mediaGeral(resumos);

  return (
    <PedidoFunnel
      provaSocial={
        <ProvaSocial
          avaliacoes={avaliacoes}
          resumos={resumos}
          media={media}
          total={total}
        />
      }
    />
  );
}
