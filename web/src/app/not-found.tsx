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
            <Link href="/reserva" className="btn-secondary">
              Reservar o uniforme
            </Link>
          </>
        }
      >
        <p>
          O link pode estar incompleto. A reserva do uniforme continua no menu
          acima.
        </p>
      </TelaAviso>
    </AppShell>
  );
}
