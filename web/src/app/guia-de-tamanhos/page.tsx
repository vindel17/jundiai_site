import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FotoPeca } from "@/app/reserva/reserva-pecas";
import { DOMINIO_PADRAO } from "@/lib/config-publica";
import { TAMANHOS_KIT } from "@/lib/reserva/kit";
import { gradeDaPeca } from "@/lib/reserva/medidas";

const TITULO = "Como escolher o tamanho do uniforme escolar de Jundiaí";
const DESCRICAO = "Compare uma roupa que já serve com as tabelas em centímetros do kit da rede municipal de Jundiaí 2027.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: `https://${DOMINIO_PADRAO}/guia-de-tamanhos` },
  openGraph: { title: TITULO, description: DESCRICAO, url: "/guia-de-tamanhos", type: "article" },
};

const PECAS = [
  { id: "camiseta-manga-curta", titulo: "Camisetas de manga curta e longa", foto: "Camiseta de manga curta do kit" },
  { id: "blusa", titulo: "Blusa de frio", foto: "Blusa de frio do kit" },
  { id: "bermuda", titulo: "Bermuda e calça", foto: "Bermuda do kit" },
] as const;

export default function GuiaDeTamanhosPage() {
  return (
    <AppShell largo>
      <main className="uj-page">
        <article className="prose-legal mx-auto max-w-3xl">
          <h1 className="uj-page-title">{TITULO}</h1>
          <p className="uj-page-lead">
            Pegue uma peça que já serve bem na criança. Estenda a roupa sobre uma mesa e compare as
            medidas em centímetros com as do kit de 2027.
          </p>

          <h2>Onde colocar a fita métrica</h2>
          <ul>
            <li><strong>Camisetas e blusa.</strong> Meça do ombro à barra pela frente e a largura de um lado ao outro, logo abaixo das mangas.</li>
            <li><strong>Bermuda e calça.</strong> Meça a largura do cós sem puxar o elástico. Para o quadril, meça de um lado ao outro, 20 cm abaixo do cós.</li>
          </ul>

          {PECAS.map(({ id, titulo, foto }) => {
            const grade = gradeDaPeca(id);
            if (!grade) return null;
            return (
              <section key={id}>
                <h2>{titulo}</h2>
                <div className="max-w-48">
                  <FotoPeca catalogoId={id} nome={foto} />
                </div>
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <caption className="py-2 text-left">Medidas da peça estendida, em centímetros</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="w-18 border-b p-2">Tamanho</th>
                      {grade.medidas.map((medida) => <th key={medida} scope="col" className="border-b p-2">{medida}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TAMANHOS_KIT.map((tamanho) => (
                      <tr key={tamanho}>
                        <th scope="row" className="border-b p-2">{tamanho}</th>
                        {grade.valores[tamanho].map((valor, coluna) => <td key={grade.medidas[coluna]} className="border-b p-2">{valor}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}

          <h2>Short-saia</h2>
          <p>A tabela da short-saia ainda está em conferência. Se tiver dúvida sobre essa peça, peça ajuda pelo WhatsApp da loja.</p>
          <p>Na pré-reserva, você pode escolher um tamanho para cada peça do kit.</p>
          <Link className="btn-primary" href="/reserva">Reservar uniforme</Link>
        </article>
      </main>
    </AppShell>
  );
}
