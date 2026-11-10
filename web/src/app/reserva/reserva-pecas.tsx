import type { ReactNode } from "react";
import Image from "next/image";
import { getCatalogItem } from "@/data/catalogo";
import { pecasDoKit, type PecaKit } from "@/lib/reserva/kit";

const TAMANHO_IMAGEM = "(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 14rem";

export function FotoPeca({ catalogoId, nome }: { catalogoId: string; nome: string }) {
  const src = getCatalogItem(catalogoId)?.image;
  if (!src) return null;
  return (
    <div className="reserva-peca-foto">
      <Image src={src} alt={nome} width={480} height={480} sizes={TAMANHO_IMAGEM} />
    </div>
  );
}

/** Cartão de uma peça: foto, nome e, quando existir, um detalhe ou o campo de tamanho. */
export function CardPeca({
  peca,
  detalhe,
  children,
}: {
  peca: PecaKit;
  detalhe?: string;
  children?: ReactNode;
}) {
  return (
    <li className="reserva-peca">
      <FotoPeca catalogoId={peca.catalogoId} nome={peca.nome} />
      <div className="reserva-peca-corpo">
        {children ?? (
          <>
            <h3 className="reserva-peca-nome">{peca.nome}</h3>
            {detalhe ? <p className="reserva-peca-detalhe">{detalhe}</p> : null}
          </>
        )}
      </div>
    </li>
  );
}

function detalheDaPeca(peca: PecaKit) {
  if (peca.catalogoId === "bermuda") return "No kit masculino";
  if (peca.catalogoId === "short-saia") return "No kit feminino";
  return peca.quantidade > 1 ? "2 camisetas" : "1 peça";
}

/** As peças do kit, com as duas opções de baixo lado a lado. */
export function VitrinePecas() {
  const kit = pecasDoKit("masculino");
  const saia = pecasDoKit("feminino").find((peca) => peca.chave === "inferior");
  const pecas = kit.flatMap((peca) => (peca.chave === "inferior" && saia ? [peca, saia] : [peca]));

  return (
    <ul className="reserva-vitrine" aria-label="Peças do kit">
      {pecas.map((peca) => (
        <CardPeca key={peca.catalogoId} peca={peca} detalhe={detalheDaPeca(peca)} />
      ))}
    </ul>
  );
}
