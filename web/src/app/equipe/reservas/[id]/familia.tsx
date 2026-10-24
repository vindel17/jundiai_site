import Link from "next/link";
import { listarReservasDoTelefone } from "@/lib/reserva/consultas";
import { rotuloKit } from "@/lib/reserva/kit";
import { rotuloStatus } from "@/lib/reserva/status";

export async function Familia({ telefone, atual }: { telefone: string; atual: string }) {
  const { linhas } = await listarReservasDoTelefone(telefone).catch(() => ({
    linhas: [],
    codigo: "",
  }));
  const irmaos = linhas.filter((linha) => linha.id !== atual);
  if (irmaos.length === 0) return null;

  return (
    <section>
      <h2>Mesma família</h2>
      <ul className="equipe-lista">
        {irmaos.map((linha) => (
          <li key={linha.id}>
            <Link href={`/equipe/reservas/${linha.id}`}>{linha.aluno}</Link>
            {" · "}
            {rotuloKit(linha.kit)}
            {" · "}
            {rotuloStatus(linha.status)}
          </li>
        ))}
      </ul>
    </section>
  );
}
