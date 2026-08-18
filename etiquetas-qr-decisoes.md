# Etiquetas DTF + QR — decisões de produto

Documento de referência com o que foi definido nas discussões de produto (ago/2026).  
Complementa o PRD em [`site`](./site) e o [`modelo-de-negocio.md`](./modelo-de-negocio.md) (com [`recompensas.md`](./recompensas.md) e [`fase-voucher.md`](./fase-voucher.md)). Em caso de conflito com o PRD antigo, **estes arquivos + o modelo de negócio prevalecem** até o PRD ser atualizado.

---

## 1. Mudanças em relação ao PRD original

| Antes (PRD / MVP antigo) | Agora |
|--------------------------|--------|
| Brinde de etiquetas como gancho principal de captação | **Uniformes em preço promocional** (venda) + **marketplace de doação** (cadastro pré-voucher) |
| Etiqueta gratuita para captar lead | Etiqueta DTF (nome + QR) **vem junto com a compra do uniforme** |
| Pontos de retirada parceiros no início | **Em breve** (não bloqueiam doação/venda virtual) |
| Kit de etiquetas como produto de entrada | Uniforme promocional + doação tipo OLX como motores; etiqueta como **diferencial incluso** na compra |
| Bazar / troca com crédito / doação via escola | **Bazar pausado**; doação = marketplace P2P (ver §4.5 e `modelo-de-negocio.md`) |

### Em aberto (não decidido)

- **Etiqueta avulsa (só nome + QR)** — direção vigente no modelo de negócio §3.3: **sim como caminho C** (quem não doa nem recebe), no mesmo cadastro por celular; **sem** liberar 2→1 sozinha; fora do hero da home.
  - Detalhe de produção/limite por família: ainda a calibrar.
  - Status: **aceita como funil**; execução/SKU pendente.
- **Prova de doação concluída** (PIN + atraso + teto recomendados) — ver modelo de negócio.

---

## 2. Conceito da etiqueta

Cada filho/cadastro relevante recebe um **código único** (ex.: `UJ-7K2M`).

**Impressão DTF (por peça do kit incluso na compra):**

- Nome (ou iniciais) **legível** — uso principal na escola (peça perdida).
- **QR Code** apontando para o domínio da operação (não `tel:` estático).
- **Código alfanumérico curto** ao lado (fallback se o QR apagar ou a pessoa não escanear).
- **Sem telefone impresso** na peça.
- **Sem** instrução permanente do tipo “se se perder, peça para escanear” na etiqueta do dia a dia (orientação verbal aos pais/criança, se houver).

Todas as etiquetas do mesmo filho compartilham o **mesmo código** (não um código por peça), para simplificar produção e o sistema.

---

## 3. Papel de cada elemento

| Elemento | Função |
|----------|--------|
| Nome no DTF | Peça perdida na escola — leitura visual, sem celular |
| QR / código | Identidade da criança/peça **no sistema** da operação |
| Sistema atrás do QR | Avisos, emergência, troca/recompra de compra, doação (anúncio), ciclo de tamanho, CRM — o que o concorrente não copia só imprimindo DTF |

**Princípio:** um QR estático só com telefone não é produto (qualquer um copia). O valor está no domínio + cadastro + operação ligados ao código.

---

## 4. Fluxos do QR (mesma URL, contextos diferentes)

Rota pública sugerida: `/p/[codigo]` (ex.: `/p/UJ-7K2M`).

### 4.1 Triagem no primeiro acesso (quando fizer sentido)

- **Encontrei uma peça**
- **Estou com uma criança que precisa dos responsáveis**

Não oferecer a segunda opção sem o fluxo correspondente pronto.

### 4.2 Peça encontrada (terceiro / escola)

- Página intermediada pela empresa.
- Família avisada (ex.: WhatsApp), **sem expor telefone** na tela de quem escaneou (modelo preferencial para “peça”).
- Escola pode ter ação “Registrar achado” (piloto): scan em lote → aviso às famílias; escola **não** vê telefone dos pais.

### 4.3 Família escaneando a própria peça

- Troca / recompra / atualizar contatos / anunciar doação (marketplace).
- Histórico de tamanho e vínculo com pedido, quando existir compra.

### 4.4 Criança / contato de emergência

- Objetivo: reconectar criança encontrada com responsáveis — **não** é rastreamento em tempo real.
- Comunicação honesta: ajuda **depois** que alguém já encontrou a criança; não previne desaparecimento.
- Preferência de produto: botões de ação (`tel:` ou “Avisar a família”) via sistema; contatos **editáveis/pausáveis** no cadastro.
- **Modo Passeio (ativação 24h) não é obrigatório** se o QR for só emergência + sistema; o modo existia para separar “peça” vs “emergência” e limitar exposição do telefone. Decisão prática: contatos cadastrados + opção de pausar; sem ritual “ative antes do passeio” como requisito.
- Não vender como “sistema de segurança infantil” na escola; na escola o foco é peça/achados.

### 4.5 Marketplace de doação (tipo OLX) — vigente

**Decisão (ago/2026):** o motor de cadastro pré-voucher é a **doação P2P**, não o bazar. Detalhe de negócio em [`modelo-de-negocio.md`](./modelo-de-negocio.md).

- Doador: OTP → anúncio (modelo, tamanho, qtd, **foto**, **escola**) → chat → conclusão → 2→1.
- Receptor: OTP WhatsApp → **vê feed** e filtra (escola, modelo, tamanho) → opcional “procuro” + **alerta** → chat (completa perfil se faltar) → first-come.
- Se “procuro” demorar sem match: **nudge** para comprar a peça no site.
- Conta = **1 celular (OTP WhatsApp)**; Google só opcional depois.
- No máx. **1 doação contável** doador → mesmo receptor (justificativa: alcançar mais gente).
- **2 doações** para **2 pessoas** → **1 peça nova** (fase A).
- Fase B (voucher): compra kit + doa → camiseta a mais (contagem separada).
- Operação **não** estoca usado no MVP.

#### Pausado (não construir agora)

- **Bazar** com venda usada / crédito de peça / troca por tamanho intermediada.
- **Doação via escola** consumindo pool de troca com subsídio da operação.

Esses modelos antigos ficam arquivados só como referência histórica; não são roadmap ativo.

#### Elegibilidade na doação (MVP)

- Anúncio aberto a uniforme da rede (com foto). Gate de qualidade = foto + regras de conclusão/anti-colusão.
- Recompensa 2→1 é custo da operação → reforçar anti-círculo (celular único, 1 por par, anti-reciprocidade recomendada, teto).
- Etiqueta/QR continua útil para achados, recompra e (futuro) atalho “anunciar esta peça”; **não** é obrigatória para publicar doação no MVP, salvo decisão futura.

---

## 5. Pico de volta às aulas (filas, estoque, tamanho)

O “caos de janeiro” não é uma dor só — são **três**, com soluções diferentes. Ordem de ataque: **1 → 2 → 3**.

| # | Dor | Natureza |
|---|-----|----------|
| 1 | Pico de demanda concentrado (todo mundo compra na mesma quinzena) | Planejamento de produção |
| 2 | Tamanho errado / “não tem o meu tamanho” | Mix de estoque + erro de compra |
| 3 | Fila física / espera no atendimento | Distribuição de horário |

Pontos parceiros **em breve** — as soluções abaixo funcionam com retirada/entrega própria no início.

### 5.1 Contra o pico — antecipar a demanda

- **Pré-venda (out–dez) com preço melhor:** o desconto promocional é a recompensa por comprar fora do pico. Família garante peça antes do 1º dia de aula; operação ganha previsibilidade de produção.
- **Checagem de tamanho no fim do ano (disparo pelo sistema):** com código + histórico (ex.: “está no 10 desde março — confere se ainda serve?” + link para medir). Abre a pré-venda, atualiza o histórico e reduz compra errada — uso de alto valor do QR/código.
- **Previsão de mix por escola:** com base de tamanhos + datas, estimar quantos sobem de tamanho e o que produzir antes do pico (dado que o concorrente não tem).
- **Cuidado:** pré-venda = dinheiro adiantado com obrigação em data crítica. Começar com janela e volume que a produção consiga cumprir; atraso em janeiro custa mais reputação do que o ganho da antecipação.

### 5.2 Contra “não tem meu tamanho”

- **Nunca exibir só “esgotado”:** sempre oferecer **sob encomenda com data** (“pronto até [data]”). Esgotado perde a venda; prazo mantém o pedido. Alinha com os estados do PRD (pronta-entrega / reposição / encomenda), com a regra de que nenhum tamanho fica sem opção de compra.
- **Fila de espera por tamanho:** “avise-me quando chegar o 12” → captura demanda reprimida e alimenta o próximo lote; aviso de chegada ≈ venda quase certa.
- **Painel público de produção (simples):** “lote camiseta 12 fica pronto dia 18” — reduz WhatsApp de “chegou?” no pico.
- **Guia pela peça que serve** (não só medir a criança): medir uma camiseta que já serve bem; reserva do novo tamanho antes da devolução (já no PRD) como **promessa explícita** (“errou o tamanho? o novo fica separado — sem nova fila”).

### 5.3 Contra a fila física

- **Retirada com horário agendado:** família escolhe janela (ex.: 14h–14h30); pedido pré-separado; **QR do pedido** como senha de retirada. Funciona sem pontos parceiros (espaço próprio).
- **Entrega no pico como válvula:** entrega domiciliar (mesmo paga) ou lotes por bairro/escola tiram gente da fila em janeiro.
- **Troca sem fila nova:** combinar reserva do tamanho certo + agendamento — a troca não compete com a fila de quem está comprando pela primeira vez.

### 5.4 O que entra em qual fase (operação / pico)

| Fase | Ações |
|------|--------|
| A / B | “Avise-me quando chegar”; nunca só “esgotado”; agendamento de retirada (formulário + WhatsApp ok no início) |
| B / D | Pré-venda sazonal; checagem automática de tamanho pelo código |
| Com base instalada | Previsão de mix por escola; painel de produção |

---

## 6. Vantagens da etiqueta (lista de produto)

### Para os pais

1. Nome na peça → devolução mais fácil na escola.
2. Menos perda / troca indevida de uniforme.
3. QR sem telefone impresso na roupa.
4. Contatos atualizáveis sem reimprimir.
5. Aviso quando alguém encontra a peça (via sistema).
6. Contato de emergência (secundário; sem rastreador).
7. Troca e recompra facilitadas pelo código.
8. Histórico de tamanho.
9. Doar uniforme que não serve mais (marketplace).
10. Receber alerta quando aparecer a peça/tamanho que procura.
11. Doar 2× (para famílias diferentes) e ganhar 1 peça nova (fase A).
12. Código curto de backup.
13. Inclusa na compra do uniforme (diferencial do produto promocional).
14. Pré-venda fora do pico (preço melhor + peça garantida antes do 1º dia).
15. Aviso quando o tamanho esgotado chega / encomenda com data clara.
16. Retirada agendada (sem fila de sábado de manhã).
17. Troca com reserva do novo tamanho (sem pegar fila de novo).

### Para a escola

18. Achados e perdidos mais rápido (nome + scan).
19. Aviso à família sem a secretaria ligar / expor telefones.
20. Menos peça acumulada no fim do período.
21. Custo zero para a escola; escola não vende.
22. Padrão único na rede (mesmo uniforme + mesma lógica).
23. Famílias com canal próprio de doação/recebimento → menos pressão informal na secretaria.
24. Cadastro leve da escola para achados (e, depois, divulgação da doação) — sem estocar nem vender.

### Para a operação

25. Moat: sistema + CRM + escolas, não só DTF.
26. Prova de uso / engajamento via scans e doações.
27. Aquisição quando terceiros caem no domínio.
28. Dados de demanda por tamanho / escola / bairro (venda + “procuro”).
29. Remarketing contextual (“tempo no tamanho X”) + checagem de tamanho no fim do ano.
30. Menos atrito no WhatsApp (peça/pedido identificados; painel de produção reduz “chegou?”).
31. Porta de entrada institucional (achados).
32. Marca no armário o ano inteiro.
33. Base de identidade para fase voucher (doador + receptor cadastrados).
34. Expertise DTF própria → custo baixo de produção.
35. Marketplace de doação como motor de cadastro pré-voucher (barreira vs. concorrente).
36. Pré-venda suaviza o pico de janeiro; fila de espera por tamanho revela demanda real (não só o que vendeu em estoque).
37. Recompensa 2→1 controlada (celular único, 1 doação por destinatário, teto).

---

## 7. Comunicação com escolas (1ª abordagem)

### Posicionamento

> Identificamos o uniforme da família. A escola escaneia o que sobrou no achados e perdidos; o sistema avisa o responsável. Sem telefone na peça. Sem a escola vender.

### Ordem da reunião

1. Dor da secretaria (cesto / peça sem dono).
2. Demo: etiqueta → scan → aviso ao responsável.
3. Vantagens para os **pais** (para a escola se sentir confortável em divulgar).
4. O que pedimos: divulgar link/cartaz; orientar “nome primeiro, QR se precisar”.
5. O que **não** pedimos: vender na escola, guardar estoque, planilha de alunos, endosso “oficial da prefeitura”.

### Evitar na escola

- “Parceiro oficial” / brasão / SME sem autorização.
- Abrir a reunião com “segurança / criança perdida” como título.
- Prometer pontos parceiros ou doação/recompensa operacionalmente maduros antes de existir.

### Ponte escola → pais (frase)

> Além de organizar o achados e perdidos de vocês, o mesmo site ajuda as famílias a doar e receber uniforme que não serve mais — com cadastro no celular e combinação direta entre responsáveis. A escola não estoca nem vende.

---

## 8. Comunicação com pais (alinhada ao novo funil)

**Gancho principal (cadastro):** marketplace de doação.  
**Gancho comercial:** uniforme em preço promocional.  
**Caminho C (discreto):** etiquetas para quem só quer identificar a peça — menu / link secundário, não hero.  
**Sem framing de “brinde grátis”** na landing de etiquetas (decisão 2026-08-11: caminho C, não gancho de inauguração).  
**Diferencial incluso na compra:** etiqueta nome + QR no sistema.  
**Indicação:** 1 etiqueta ao completar perfil do aluno pelo link; 5 na 1ª compra (ver `recompensas.md`).

Exemplo de mensagem (doação / cadastro):

> Tem uniforme parado no armário? Doe por aqui.  
> Quem precisa encontra por tamanho e conversa no chat do site.  
> Doe para duas famílias diferentes e ganhe uma peça nova.  
> Conta vinculada ao seu celular — uma doação por família, para alcançar mais gente.

Exemplo de mensagem (venda):

> Uniforme escolar com preço promocional.  
> Na compra, você leva etiquetas com o nome do aluno e QR: facilita achar a peça na escola e avisa a família se alguém encontrar.  
> Sem telefone impresso na roupa.

Exemplo de mensagem (só etiquetas — caminho C):

> Já tem o uniforme e só quer o nome na peça?  
> Peça suas etiquetas com o mesmo cadastro do site.  
> Depois, se quiser, você também pode doar o que não serve mais.

Exemplo de mensagem (pré-venda / fora do pico):

> Garanta o uniforme antes da volta às aulas, com preço melhor e retirada agendada — sem fila de janeiro.  
> Se o tamanho esgotar, você encomenda com data ou deixa aviso quando chegar.  
> Na compra, etiquetas com nome + QR inclusas.

---

## 9. Fases sugeridas (etiqueta / sistema)

### Fase A — Comercial + etiqueta “simples” + doação MVP (agora)

- Venda de uniforme promocional (site).
- Etiqueta DTF com nome (+ QR apontando para página básica, se já houver domínio).
- Cadastro: **OTP WhatsApp** → completar perfil (responsável, aluno, escola, tamanho) → ações.
- Marketplace de doação: foto, chat interno, “procuro” + alerta, 1 doação/destinatário, 2→1.
- Pontos parceiros: em breve (não prometer no ar se ainda não existirem).
- Sem prometer emergência/escola scan se ainda não estiver pronto.
- Pico (mínimo): não vender só como “esgotado”; “avise-me quando chegar”; agendamento de retirada quando fizer sentido.

### Fase B — Sistema mínimo do código

- Código único por filho na compra.
- Página `/p/[codigo]`: peça encontrada → avisar família.
- Contatos de emergência editáveis (opcional).
- Migração de CRM (ex.: Sheets → banco) quando o código exigir unicidade/busca/revogação.
- Encomenda com data; fila de espera por tamanho ligada ao cadastro.
- Atalho no QR: “anunciar esta peça para doação” (opcional).

### Fase C — Escola piloto

- Fluxo “registrar achado” para secretaria.
- Material de divulgação autorizado pela escola (achados + link da doação).
- Cadastro/login leve da escola (achados; sem login de “pedido de doação subsidiada”).

### Fase D — Família + ciclo de vida (venda)

- Scan da própria peça: troca / recompra de compra.
- Pré-venda sazonal + checagem de tamanho pelo código (fim do ano).
- Troca com reserva do novo tamanho + retirada agendada (QR do pedido).
- Pontos parceiros ativos, se já disponíveis.

### Fase D+ — Pausado / reavaliar depois

- Bazar com crédito de peça / troca por tamanho intermediada.
- Doação via escola consumindo pool com subsídio.

### Fase E — Decisão pendente

- Etiqueta avulsa para peças antigas: sim / não / só em campanha.
- Prova definitiva de conclusão da doação (PIN etc.).
- Promo voucher fase B (kit + doar → camiseta a mais) quando o programa existir.

### Pico com base instalada (paralelo às fases acima)

- Previsão de mix por escola; painel público de produção; entrega/lotes no pico como válvula.

---

## 10. Princípios de risco e compliance

- Dado de criança: cuidado LGPD (consentimento claro, retenção, poder desativar código).
- Não prometer rastreamento nem prevenção de desaparecimento.
- Emergência: downside assimétrico — não colocar a empresa como operadora de “alerta de segurança 24h” no lançamento.
- Preferir identificação intermediada / `tel:` sob controle de cadastro a telefone legível na peça.
- Testar durabilidade do QR em lavagens antes de prometer em campanha.
- Pré-venda: só comprometer volume/prazo que a produção consegue cumprir (atraso no pico = dano reputacional alto).
- Doação: anti-colusão (1 celular = 1 conta; 1 doação contável por destinatário; anti-reciprocidade recomendada; teto de peça nova).
- Chat interno: moderação mínima + denúncia; não expor telefone de criança/responsável no anúncio público.
- Não vender leads a terceiros sem base legal e transparência explícita (modelo atual = CRM próprio).

---

## 11. Resumo executivo

1. **Vende-se o uniforme** no site; a etiqueta é diferencial incluso na compra.  
2. **Doação tipo OLX** é o motor de cadastro pré-voucher (foto, chat, alertas, first-come).  
3. **Nome** resolve a escola no dia a dia; **QR** liga a peça à operação (achados, recompra, atalho de doação).  
4. Recompensa: **2 doações (2 pessoas) → 1 peça nova**; no voucher, kit + doar → camiseta a mais.  
5. Identidade: **WhatsApp OTP** (1 celular = 1 conta); Google opcional depois; perfil = responsável + aluno + escola antes de doar/receber; CPF/endereço na compra.  
6. **Bazar/troca com crédito e doação via escola:** pausados.  
7. **Pontos parceiros:** em breve.  
8. **Etiquetas avulsas:** caminho C (fora do hero); mesmo cadastro; sem 2→1 sozinhas.  
9. **Em aberto:** prova de conclusão da doação (PIN etc.); limite/SKU do kit de etiquetas.

---

*Última atualização: 2026-08-08*
