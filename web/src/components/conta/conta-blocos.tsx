import Link from "next/link";

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
