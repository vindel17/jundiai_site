type Props = {
  /** Quantos blocos de cartão desenhar abaixo do título. */
  cartoes?: number;
};

/** Silhueta exibida enquanto a rota carrega, no lugar da tela em branco. */
export function EsqueletoPagina({ cartoes = 3 }: Props) {
  return (
    <div className="uj-carregando" role="status" aria-label="Carregando">
      <span className="uj-skel uj-skel-titulo" />
      <span className="uj-skel uj-skel-linha" />
      {Array.from({ length: cartoes }, (_, index) => (
        <span key={index} className="uj-skel uj-skel-cartao" />
      ))}
    </div>
  );
}
