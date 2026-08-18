import { pedirPeca } from "@/app/doacao/acoes";
import { BotaoAcao } from "@/components/botao-acao";
import { urlFotoAnuncio } from "@/lib/doacao/foto";
import { nomeDoModelo } from "@/lib/doacao/modelos";
import { haQuanto } from "@/lib/doacao/tempo";

export type AnuncioFeed = {
  id: string;
  perfil_id: string;
  modelo_id: string;
  tamanho: string;
  quantidade: number;
  escola: string;
  estado: "bom" | "regular";
  foto_path: string | null;
  criado_em: string;
};

export function ListaAnuncios({
  lista,
  userId,
}: {
  lista: AnuncioFeed[];
  userId: string;
}) {
  return (
    <ul className="doacao-list">
      {lista.map((item) => {
        const foto = urlFotoAnuncio(item.foto_path);
        const meu = item.perfil_id === userId;
        return (
          <li key={item.id} className="doacao-card">
            <div className="doacao-card-photo" aria-hidden>
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                "Sem foto"
              )}
            </div>
            <div className="doacao-card-body">
              <div className="doacao-card-top">
                <strong>{nomeDoModelo(item.modelo_id)}</strong>
                <span className="doacao-size">Tam. {item.tamanho}</span>
              </div>
              <p className="doacao-card-meta">
                {item.quantidade} {item.quantidade === 1 ? "peça" : "peças"} ·
                estado {item.estado}
                <span className="doacao-card-school">{item.escola}</span>
              </p>
              <div className="doacao-card-actions">
                {meu ? (
                  <span className="doacao-fresh">Seu anúncio</span>
                ) : (
                  <form action={pedirPeca}>
                    <input type="hidden" name="anuncioId" value={item.id} />
                    <BotaoAcao pendenteLabel="Pedindo...">
                      Quero esta peça
                    </BotaoAcao>
                  </form>
                )}
                <span className="doacao-fresh">Anunciada {haQuanto(item.criado_em)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
