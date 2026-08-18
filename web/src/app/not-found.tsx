import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TelaAviso } from "@/components/tela-aviso";

export const metadata = {
  title: "Página não encontrada",
};

export default function NaoEncontrado() {
  return (
    <AppShell>
      <TelaAviso
        titulo="Não encontramos esta página"
        acoes={
          <>
            <Link href="/" className="btn-primary">
              Ir para o início
            </Link>
            <Link href="/doacao/receber" className="btn-secondary">
              Ver peças disponíveis
            </Link>
          </>
        }
      >
        <p>
          O link pode estar incompleto, ou a peça que você procurava já foi para
          outra família. Os caminhos do site continuam no menu acima.
        </p>
      </TelaAviso>
    </AppShell>
  );
}
