# Modelo de Negócio — Uniformes Escolares (Espaço Livre / Jundiaí)

Documento vivo. Hub da estratégia alinhada em ago/2026.

Em conflito com o PRD antigo (`site`), **este arquivo + os documentos da tabela abaixo prevalecem** até o PRD ser reescrito.

Última atualização: 2026-08-15 (canal WhatsApp = interface de baixa fricção; site continua para feed/kits/checkout; ver `whatsapp-agente.md`)

---

## 1. Conceito em uma frase

Indústria verticalizada que **vende uniforme no site** e usa um **marketplace de doação (tipo OLX)** para captar cadastros de doadores e receptores antes do voucher municipal.

---

## 2. Como se ganha dinheiro

| Fonte | Quando | Papel |
|-------|--------|--------|
| Venda virtual no site (peça / kit) | Agora e depois | Receita principal |
| Voucher municipal | Quando o programa abrir | Escala de volume |
| Base (CRM) via doação (+ etiquetas caminho C) | Pré-voucher | Ativo: criança + escola + tamanho + celular; converte na liberação do crédito |

**“Leads”** = cadastros próprios no funil de doação (doador e receptor). Não é venda de lista a terceiros.

---

## 3. Três caminhos no site (hierarquia para não confundir)

Um só cadastro (celular). Três intenções — **sem três heróis competindo**.

| Prioridade | Caminho | Para quem | Papel |
|------------|---------|-----------|--------|
| **1 — Hero** | Doar / receber | Quer circular uniforme | Máximo de cadastros pré-voucher |
| **2 — CTA forte** | Comprar uniforme | Precisa de peça nova agora | Receita |
| **3 — Secundário** | Etiquetas | Não quer doar nem receber (só identificar a peça) | Lead “leve”; não disputa o hero |

### Como evitar confusão na interface

- **Home:** título focado em **doação** (hero). Compra como CTA forte abaixo. Etiquetas **não** no hero.
- **Decisão 2026-08-11:** começar com doação no hero — prioridade atual é **gerar leads**, não maximizar compra imediata.
- Entrada de etiquetas: caminho C — link no menu ou texto discreto: *“Só quero colocar o nome no uniforme →”*. **Sem** framing de “brinde grátis” / “é grátis!” no hero de etiquetas.
- Depois do pedido de etiqueta: **um** convite opcional (“Quer doar o que não serve mais?”) — sem forçar.
- Mesma conta serve para os três caminhos (não criar “cadastro de etiqueta” separado).

### 3.1 Venda virtual

- Catálogo + checkout no site.
- Na compra, etiqueta DTF nome+QR **inclusa** (ver `etiquetas-qr-decisoes.md`).
- Pontos parceiros de retirada: **em breve**.

### 3.2 Marketplace de doação (ênfase pré-voucher)

Objetivo nº 1 antes do voucher: **maximizar cadastros**.

#### Fluxo — quem doa

1. Entra com **OTP WhatsApp** (cria conta).
2. Completa o necessário para anunciar: peça(s) — **tipo/modelo, tamanho, quantidade**, **foto**, **escola** (da peça / da família).
3. Publica → vira **anúncio** visível no feed (filtros: escola, modelo, tamanho, etc.).
4. Recebe interessados no **chat interno**; combina retirada (P2P).
5. First-come: quem fechar primeiro leva; marca conclusão conforme regra vigente.
6. Acumula doações concluídas (máx. 1 contável por receptor) → com **2 receptores diferentes** resgata **1 peça nova** (ver `recompensas.md`).

#### Fluxo — quem recebe

1. Entra com **OTP WhatsApp** (pode **só isso** para **ver** o feed de doações).
2. Navega anúncios e **filtra** (escola, modelo, tamanho, etc.).
3. Opcional: cadastra **“estou procurando”** (peça + tamanho [+ escola]) → **alerta** quando surgir anúncio compatível.
4. Ao **falar com o doador** (abrir chat / pedir a peça): completar perfil leve se ainda faltar (nome responsável, aluno, escola) — lead fica utilizável sem travar a vitrine.
5. Combina retirada no chat; first-come.
6. **Nudge de compra (depois de um tempo):** se o “procuro” ficou sem match por X dias (ex.: 7–14), disparar WhatsApp/push sugerindo **comprar essa peça no site** (“ainda não entrou doação do tamanho 10 — você pode garantir a nova aqui”). Não forçar; é opção.

#### Regras de produto (doação)

- Chat interno (WhatsApp do usuário **não** no anúncio público).
- 1 doação contável por par doador→receptor; 2→1 peça nova (fase A) — detalhe em `recompensas.md`.
- Fase B (voucher): kit + doar → camiseta a mais (contagem separada) — **não construir antes do edital** (ver `recompensas.md` e `fase-voucher.md`).

**Bazar / troca com crédito:** pausado.  
**Doação via escola + subsídio do pool:** supersedido.

### 3.3 Etiquetas (caminho C — quem não doa nem recebe)

- Kit/pedido de etiquetas com nome (+ QR quando o sistema existir) para quem **só** quer identificar o uniforme que já tem.
- Exige o **mesmo** cadastro (celular, filho, escola).
- **Não** libera sozinha a recompensa 2→1 (só doação concluída libera).
- Volume/limite por família para não virar custo sem retorno.
- Comunicação: *“identifique o uniforme”* — nunca misturar com “ganhe peça nova” no mesmo bloco.
- Detalhe de produto: `etiquetas-qr-decisoes.md`.

### 3.4 Canal WhatsApp (interface de baixa fricção)

**Decisão 2026-08-15:** o site continua; o WhatsApp vira uma **segunda interface** para as mesmas intenções (doar / receber / comprar / conta), com menos fricção — sem obrigar o cliente a “encontrar o site” e preencher formulários.

Não é paridade 1:1 tela a tela. É **atalho conversacional** + site quando a UI visual for melhor.

| Preferir WhatsApp | Preferir site |
|-------------------|---------------|
| Doar com foto, “procuro”, alertas, aceitar/confirmar doação | Feed completo de doações (filtros + muitas fotos) |
| Compra simples / kit sugerido a partir de tamanhos conhecidos | Montar kits complexos e editar várias linhas |
| Status, benefícios, indicação, “Meu uniforme” | Dashboard detalhado, histórico, comprovantes |
| Notificações e pós-venda (“serviu?”) | Checkout/pagamento (endereço, CPF, Pix/cartão) |

**Menu guiado (MVP conceitual):**

```
🛍️ Comprar · ♻️ Doar · 🎁 Procurar doação · 📦 Meu pedido · 🎉 Meus benefícios
```

(Evolução: 👕 Meu uniforme.)

Cadastro progressivo na conversa (telefone → nome → escola → bairro → tamanhos → …) sem parecer formulário. Simulações completas, limites da Meta e divisão site×WA: [`whatsapp-agente.md`](./whatsapp-agente.md).

**Estado atual do produto:** OTP + links `wa.me` + pedido pré-montado; **ainda sem** webhook inbound / chatbot. Construir reutilizando as mesmas RPCs/ações do site.

---

## 4. Identidade, cadastro e anti-colusão

### 4.1 Como entrar (autenticação)

| Decisão | Detalhe |
|---------|---------|
| Porta principal | **OTP via WhatsApp** (SMS só como fallback) |
| Stack | **Supabase** (Postgres + sessão + storage das fotos) |
| Entrega do código | **Meta WhatsApp Cloud API** via *Send SMS Hook* do Supabase |
| Identidade | **1 celular verificado = 1 conta** |
| Família | Vários filhos na **mesma** conta |
| Google | **Opcional depois** (“vincular Google” para reabrir mais rápido) — **nunca** como única identidade no MVP |
| Evitar no dia 1 | E-mail + senha; só Google; CPF na porta |

Sem celular verificado: não doar, não concluir doação, não resgatar peça nova.

### 4.2 Dados do lead (pedir em camadas)

WhatsApp **abre** a conta. Sozinho **não** basta para o lead valer no voucher. O resto entra progressivo — não pedir checkout na porta.

| Momento | Dados | Por quê |
|---------|--------|---------|
| **1. Entrar** | Celular (OTP WhatsApp) | Conta + anti-fraude; receptor já pode **ver** o feed |
| **2a. Anunciar doação** | Tipo/modelo · tamanho · qtd · foto · escola | Anúncio completo |
| **2b. Pedir peça / abrir chat / etiqueta** | Nome do responsável · nome do aluno · escola · tamanho (se possível) | Lead útil; match; campanha no voucher |
| **3. Na compra** (incl. nudge se doação demorar) | CPF · endereço · e-mail · pagamento | Só quem vai pagar |

**Régua:** WhatsApp = entrar e ver · anúncio/chat/etiqueta = enriquecer lead · CPF/endereço = checkout.

### 4.3 Anti-colusão

| Regra | Decisão |
|-------|---------|
| Par doador→receptor | No máximo **1 doação contável** para a mesma pessoa |
| Justificativa pública | “Assim a recompensa ajuda a **alcançar mais gente**” |
| Reciprocidade (recomendado) | Se A já doou pra B, B→A **não conta** para recompensa por um período |

Recompensas que usam essas regras: `recompensas.md`.

---

## 5. O que a operação faz vs. o que as famílias fazem

| Operação | Famílias |
|----------|----------|
| Site de venda + checkout | Compram uniforme |
| Plataforma de anúncio, alerta, chat, regras 2→1 | Anunciam / buscam / combinam retirada |
| Link de indicação + placar (a cada ≈ R$ 350 → 1 camiseta, repetível) | Compartilham link; indicados novos compram |
| Emite peça nova (doação e/ou indicação) + etiquetas de boas-vindas ao indicado | Confirmam conclusão / resgatam prêmio |
| CRM por celular / filhos / escola | Mantêm cadastro atualizado |
| Pontos parceiros (em breve) | Retiram pedidos / trocas de compra |

A operação **não** estoca o usado no MVP da doação (P2P).

---

## 6. Fases de execução

| Fase | Foco |
|------|------|
| Agora | Site venda + doação OLX (WhatsApp OTP, perfil filho+escola, foto, chat, alertas, 2→1) |
| Em breve | Indicação por link (ver `recompensas.md` §4: cookie 30d, confirmação 7d, resgate em domicílio); pontos parceiros de retirada |
| Canal WA | Agente/menu WhatsApp como interface de baixa fricção (ver `whatsapp-agente.md`); site permanece para feed/kits/checkout |
| Pré-voucher | Maximizar base; pré-venda comercial em paralelo |
| Voucher | Venda com crédito — pré-requisitos e restrições em `fase-voucher.md` |
| Depois (opcional) | Reavaliar bazar/troca com crédito; papel da escola na doação |

---

## 7. Relação com outros documentos

| Documento | Papel |
|-----------|--------|
| `modelo-de-negocio.md` (este) | Hub: estratégia, caminhos, identidade, fases |
| [`whatsapp-agente.md`](./whatsapp-agente.md) | Canal WA: menu, simulações, divisão site×chat, CRM progressivo, limites |
| [`recompensas.md`](./recompensas.md) | Mecânicas: 2→1, indicação, prova de conclusão, restrições na fase voucher |
| [`fase-voucher.md`](./fase-voucher.md) | Plano operacional: capacidade, giro, credenciamento, métrica-norte |
| [`etiquetas-qr-decisoes.md`](./etiquetas-qr-decisoes.md) | Produto etiqueta/QR, achados, fases técnicas |
| `site` (PRD) | Estrutura de páginas — **parcialmente desatualizado** (etiquetas grátis como gancho, pontos parceiros no centro, sem marketplace de doação) |

---

## 8. Em aberto / próximos refinamentos

Itens de produto e funil. Capacidade/credenciamento → `fase-voucher.md`. Recompensas → `recompensas.md`.

1. Estado mínimo aceito na foto do anúncio.
2. Atualizar o PRD `site` (menu, home, FAQ) para doação + venda virtual + caminho C etiquetas.
3. Atualizar a política de privacidade para cobrir dado de aluno e chat / agente WhatsApp (antes do go-live).
4. Momento de captura do CPF. O crédito do voucher é por CPF do responsável; hoje o CPF só entra no checkout. Manter fora da porta, mas definir onde entra (ver também `fase-voucher.md`).
5. Gravar `data da medição` do tamanho — sem ela não dá para disparar a checagem de fim de ano nem prever quem sobe de tamanho (também alimenta “Meu uniforme” no WA).
6. Prioridade e escopo do MVP do agente WhatsApp (webhook, templates Meta, handoff humano) — detalhe em `whatsapp-agente.md` §7.

**Resolvido em ago/2026:** stack (Supabase), provedor do OTP (Meta Cloud API),
schema com anti-colusão no banco, telas de entrar e completar perfil.

---

## 9. Descartado ou pausado (não construir agora)

- Bazar com crédito de peça / troca 1:1 intermediada como produto principal.
- Doação só via pedido da escola com subsídio do pool de troca.
- Parceiro como revendedor credenciado.
- App próprio da família no ano 1.
- Venda de leads a terceiros.
- Cadastro só com Google (sem celular verificado).
- Pedir CPF/endereço na porta do site.
