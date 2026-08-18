import Link from "next/link";

export type FilhoResumo = {
  id: string;
  nome: string;
  escola: string;
  tamanho_atual: string | null;
};

export type PedidoResumo = {
  id: string;
  papel: "doador" | "receptor";
  aceito: boolean;
  peca: string;
};

export function RedeCircularCard({
  contaveis,
  pecas,
  faltam,
  pedidos,
}: {
  contaveis: number;
  pecas: number;
  faltam: number;
  pedidos: PedidoResumo[];
}) {
  return (
    <section className="conta-card" aria-labelledby="conta-rede">
      <div className="conta-card-head">
        <h2 id="conta-rede">Rede Circular</h2>
      </div>
      <p className="conta-card-lead">
        Doe para 2 famílias diferentes e a peça nova é por nossa conta.
      </p>
      <ul className="conta-lista">
        <li>
          <b>Doações que valem ponto</b>
          <span>{contaveis}</span>
        </li>
        <li>
          <b>Peças novas conquistadas</b>
          <span>{pecas}</span>
        </li>
        <li>
          <b>Para a próxima peça</b>
          <span className={faltam > 0 ? "conta-falta" : undefined}>
            {faltam} {faltam === 1 ? "doação" : "doações"}
          </span>
        </li>
      </ul>
      {pedidos.length > 0 ? (
        <ul className="conta-lista">
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <b>
                {pedido.papel === "doador"
                  ? pedido.aceito
                    ? "Combinar retirada"
                    : "Pedido para aceitar"
                  : pedido.aceito
                    ? "Combinar retirada"
                    : "Aguardando o doador"}
              </b>
              <Link href={`/doacao/pedido/${pedido.id}`}>{pedido.peca}</Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="conta-acoes">
        <Link href="/doacao/doar">Doar uma peça</Link>
        <Link href="/doacao/receber">Ver o que tem disponível</Link>
      </div>
    </section>
  );
}

export function AvaliarCompraCard() {
  return (
    <section className="conta-card" aria-labelledby="conta-avaliar">
      <div className="conta-card-head">
        <h2 id="conta-avaliar">Avaliar compra</h2>
      </div>
      <p className="conta-card-lead">
        Já comprou o uniforme? Deixe de 1 a 5 estrelas, um comentário e fotos.
        Ajuda outras famílias a escolher com confiança.
      </p>
      <div className="conta-acoes">
        <Link href="/conta/avaliar">Escrever avaliação</Link>
      </div>
    </section>
  );
}

export function MeuKitCard({ filhos }: { filhos: FilhoResumo[] }) {
  return (
    <section className="conta-card" aria-labelledby="conta-kit">
      <div className="conta-card-head">
        <h2 id="conta-kit">Meu Kit</h2>
      </div>
      <p className="conta-card-lead">
        Quem usa o uniforme, a escola e o tamanho. É com isso que a gente avisa
        você quando a peça certa aparecer.
      </p>
      <ul className="conta-lista">
        {filhos.map((filho) => (
          <li key={filho.id}>
            <b>
              {filho.nome} — {filho.escola}
            </b>
            {filho.tamanho_atual ? (
              <span>tam. {filho.tamanho_atual}</span>
            ) : (
              <span className="conta-falta">falta o tamanho</span>
            )}
          </li>
        ))}
      </ul>
      <div className="conta-acoes">
        <Link href="/comprar">Comprar uniforme</Link>
        <Link href="/etiquetas">Pedir etiquetas</Link>
      </div>
    </section>
  );
}
