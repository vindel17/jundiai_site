import { SiteFooter } from "@/components/site-chrome";
import { SiteTopbar, WhatsAppFab } from "@/components/site-topbar";

type Props = {
  children: React.ReactNode;
  /** Telas com barra fixa no rodapé (funil de pedido) sobem o botão flutuante. */
  comBarraFixa?: boolean;
  /** Telas que aproveitam o PC em duas colunas deixam a moldura passar de 32rem. */
  largo?: boolean;
};

/** Moldura das telas de aplicação: topbar, conteúdo, rodapé e ajuda. */
export function AppShell({ children, comBarraFixa = false, largo = false }: Props) {
  return (
    <div
      className="uj-shell"
      data-barra={comBarraFixa ? "true" : undefined}
      data-largo={largo ? "true" : undefined}
    >
      <SiteTopbar />
      <div id="conteudo" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
      <WhatsAppFab acimaDaBarra={comBarraFixa} />
    </div>
  );
}
