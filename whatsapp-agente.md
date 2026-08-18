# Agente WhatsApp — Canal de baixa fricção

Documento vivo. Complementa `modelo-de-negocio.md`.

Última atualização: 2026-08-17 (etapa 2: menu + procurar doação + alerta de `procuro`)

---

## 1. Conceito

O site continua. O WhatsApp vira uma **interface mais prática** para as jornadas mais frequentes: o cliente começa e conclui ações sem abrir o navegador, sem “encontrar o site” e sem aprender formulários.

Não é “copiar 100% do site no chat”. É **reduzir fricção** nas ações curtas e usar o site quando a interface visual for claramente melhor.

| Canal | Papel |
|-------|--------|
| **WhatsApp** | Intenção, atalhos, notificações, doação, procura, status, benefícios, compra simples |
| **Site** | Feed completo, filtros, kits complexos, checkout/pagamento, dashboard detalhado, conteúdo longo |

**Identidade:** 1 celular = 1 conta. Quem manda mensagem do número cadastrado já está identificado; o agente só completa o que faltar (camadas do §4.2 em `modelo-de-negocio.md`).

---

## 2. O que fica no site vs. no WhatsApp

### Exclusivamente (ou preferencialmente) no site

- Ver **todos** os itens disponíveis para doação (feed, filtros combinados, comparação de fotos).
- **Montar kits** com várias peças/tamanhos e editar o carrinho com agilidade.
- **Checkout e pagamento** (endereço completo, CPF, Pix/cartão, voucher).
- Dashboard e histórico detalhado (todas as doações, pedidos, resgates, comprovantes).
- Gerenciamento completo de anúncios (editar vários campos, trocar fotos, pausar/excluir).
- Configurações da conta (vários filhos, endereço, privacidade).
- Conteúdo longo (política, regulamento, guia de tamanhos completo).

### Começa no WhatsApp e pode terminar no site

- Busca de doações → “Encontrei N opções” + link já filtrado.
- Kit sugerido → “Revisar e finalizar” abre o carrinho pronto.
- Compra → montagem no chat; pagamento via link seguro quando existir checkout online.
- Consulta de conta → resumo no chat + “Ver detalhes” no site.

### Completamente pelo WhatsApp

- Doar peça(s) com foto.
- Cadastrar “estou procurando” / lista de espera.
- Receber alerta quando surgir peça compatível.
- Pedir peça, aceitar/recusar interessado, confirmar entrega.
- Status de pedido e pós-venda (serviu? troca?).
- Solicitar etiquetas.
- Ver benefícios (Circular + Compartilhe e Ganhe).
- Compartilhar link de indicação.
- “Meu uniforme” (tamanhos cadastrados / atualizar).
- Handoff para atendimento humano.

---

## 3. Menu principal (simulação)

```
🛍️ Comprar
♻️ Doar
🎁 Procurar doação
📦 Meu pedido
🎉 Meus benefícios
```

Depois de algum tempo de uso, acrescentar:

```
👕 Meu uniforme
```

O menu é o caminho guiado. Linguagem natural (“quero doar uma calça tam 10”) também deve funcionar e cair no mesmo fluxo.

---

## 4. Simulações de conversa

### 4.1 🛍️ Comprar

**Usuário:** 🛍️ Comprar

**Agente:**  
Ótimo! 😊 Vou te ajudar a encontrar o uniforme certo e montar seu pedido por aqui.

Primeiro, para qual escola você está procurando o uniforme?

**Usuário:** EMEB João XXIII

**Agente:**  
Perfeito. E o que você precisa?

```
👕 Camisetas
🩳 Shorts/Bermuda
👖 Calças
🧥 Agasalhos
🎒 Montar um kit completo
```

**Usuário:** Montar um kit completo

**Agente:**  
Ótimo! Você já sabe os tamanhos?

```
✅ Sim, já sei
📏 Tenho dúvida
👕 Já comprei antes na Espaço Livre
```

**Se já for cliente:**

**Agente:**  
Encontrei seu último cadastro. 😊

Últimos tamanhos:  
Camiseta: 12  
Calça: 14  
Shorts: 12  

Esses tamanhos continuam servindo?

**Se responder que não:**

**Agente:**  
Sem problema. Posso te ajudar a atualizar.

Aproximadamente qual é a altura da criança?

*(Depois cruza com a tabela de medidas.)*

**Agente:**  
Pelo que você informou, eu começaria verificando:

👕 Camiseta 14  
🩳 Shorts 14  
👖 Calça 14  

Quer que eu monte um kit nesse tamanho?

**Usuário:** Sim

*(Agente consulta estoque.)*

**Agente:**  
Montei uma sugestão:

**Kit Escolar**  
3 camisetas tamanho 14  
2 shorts tamanho 14  
2 calças tamanho 14  
1 blusão tamanho 14  

Tudo disponível no momento. ✅  

Total: R$ XXX

```
🛒 Continuar
✏️ Alterar quantidades
👕 Ver fotos das peças
```

Aqui a pessoa pode finalizar praticamente tudo pelo WhatsApp. Kits muito complexos ou comparação visual → link para o site com o carrinho pré-montado.

**Agente:**  
Como prefere receber?

```
🚚 Entrega em casa
🏬 Retirada
```

Segue endereço, pagamento (link seguro quando houver checkout online; até lá, confirmação com a operação) e confirmação.

#### Depois da compra — indicação

**Agente:**  
🎉 Pedido confirmado!

E agora você também pode participar do **Compartilhe e Ganhe**.

Você recebeu seu próprio link para indicar outras famílias:

🔗 `espacolivre.com.br/i/ANA4827`  
*(no produto atual: `uniformejundiai.com.br/i/...`)*

Cada nova família elegível que comprar através do seu link pode gerar peças extras para completar o uniforme da sua família, conforme as regras da campanha.

```
📲 Compartilhar meu link
🎉 Ver meus benefícios
```

Isso já transforma o comprador em divulgador.

---

### 4.2 ♻️ Doar

**Usuário:** ♻️ Doar

**Agente:**  
Que legal! 💙 Além de ajudar outra família, seus uniformes podem gerar benefícios para você.

♻️ A cada **2 peças** em bom estado doadas e entregues com sucesso, você pode ganhar **1 camiseta escolar nova**, conforme as regras da campanha.

Quantas peças você gostaria de cadastrar?

**Usuário:** 3

**Agente:**  
Perfeito! Vamos começar pela primeira.

Qual peça é?

```
👕 Camiseta
🩳 Shorts/Bermuda
👖 Calça
🧥 Agasalho
Outro
```

**Usuário:** Camiseta

**Agente:** Qual o tamanho?

**Usuário:** 10

**Agente:**  
Agora me envie uma foto da camiseta. 📸  
Isso ajuda as famílias interessadas a verem o estado da peça.

*(Usuário envia foto.)*

**Agente:**  
Recebi. 👍

Como você considera o estado dela?

```
⭐ Muito bom
👍 Bom
🧵 Tem pequenos sinais de uso
```

**Agente:** E em qual bairro você está?

**Usuário:** Eloy Chaves

**Agente:**  
Pronto! ✅

Camiseta tamanho 10 cadastrada para doação.

Agora vamos cadastrar a segunda peça?

*(Após cadastrar as três:)*

**Agente:**  
♻️ **3 peças cadastradas**

Lembrando que a recompensa é contabilizada quando a doação for realmente **concluída**.

Seu progresso:  
**0 de 2** doações concluídas

🎁 Faltam 2 doações concluídas para conquistar sua próxima camiseta nova.

Eu aviso por aqui quando alguma família demonstrar interesse.

#### Interessado e conclusão

**Agente:**  
🔔 Temos uma família interessada!

Uma responsável da sua região solicitou sua camiseta tamanho 10.

Quer continuar com a doação?

```
✅ Sim
❌ Não está mais disponível
```

*(Quando a entrega for confirmada pelos dois:)*

**Agente:**  
💙 Doação concluída!

Essa foi sua primeira doação validada.

🎁 **1 de 2**

Falta apenas mais uma para você conquistar uma camiseta nova.

*(Depois da segunda:)*

**Agente:**  
🎉 Parabéns!

Você concluiu 2 doações e conquistou **1 camiseta escolar nova**.

```
👕 Escolher tamanho
🎁 Ver meus benefícios
```

---

### 4.3 🎁 Procurar doação

Fluxo crítico para **captar leads** (telefone + necessidade + região + escola).

**Usuário:** 🎁 Procurar doação

**Agente:**  
Claro! 😊 Vou procurar as peças disponíveis para você.

O que você precisa?

```
👕 Camiseta
🩳 Shorts/Bermuda
👖 Calça
🧥 Agasalho
```

**Usuário:** Calça

**Agente:** Qual tamanho?

**Usuário:** 12

*(Consulta estoque **antes** de exigir cadastro completo.)*

**Agente:**  
Ótima notícia! 🎉

Temos **7 calças tamanho 12** cadastradas atualmente.

Para mostrar primeiro as opções mais próximas, qual é seu bairro?

**Usuário:** Vila Rami

Neste ponto o CRM já tem: **telefone + calça 12 + Vila Rami**.

**Agente:**  
Encontrei 3 opções próximas da sua região.

Antes de mostrar as fotos, vou fazer seu cadastro gratuito na Rede Circular. É bem rápido.

Qual seu nome?

**Usuário:** Juliana

**Agente:**  
Obrigado, Juliana. E em qual escola a criança estuda?

*(Usuário informa → lead qualificado.)*

**Agente:**  
Pronto! 💙

Separei algumas opções para você:

**Calça 12 — opção 1**  
👍 Bom estado · 📍 Vila Rami

**Calça 12 — opção 2**  
⭐ Muito bom estado · 📍 região próxima

**Calça 12 — opção 3**  
👍 Bom estado · 📍 região próxima

Qual gostaria de ver primeiro?

*(Pode mandar fotos no WhatsApp.)*

Ou:

Quer visualizar todas as opções com fotos?

```
📲 Ver pelo WhatsApp
🌐 Ver todas as 7 opções
```

“Ver todas” → link do site **já filtrado** (tamanho 12, calça).

#### Se não existir nenhuma (nudge comercial)

**Agente:**  
Neste momento não encontrei nenhuma calça tamanho 12 disponível para doação. 😕

Posso fazer duas coisas por você:

```
🔔 Me avisar assim que aparecer uma
🛍️ Ver a calça nova disponível
```

**Se clicar para avisar:**

**Agente:**  
Pronto! ✅

Você entrou na lista de espera para:

👖 Calça tamanho 12

Assim que uma peça compatível for cadastrada, eu te aviso por aqui.

O CRM sabe exatamente a necessidade daquela pessoa (`procuro` + `avisado_em`).

---

### 4.4 📦 Meu pedido

*(Telefone identifica a conta.)*

**Usuário:** 📦 Meu pedido

**Agente:**  
Encontrei seu último pedido. 😊

**Pedido #5837**  
3 camisetas 12  
2 shorts 12  
1 calça 14  

✅ Pagamento confirmado  
📦 Pedido em separação

O que você gostaria de fazer?

```
🚚 Acompanhar entrega
📋 Ver pedido completo
👕 Solicitar troca
💬 Falar sobre o pedido
```

**Se acompanhar:**

**Agente:**  
Seu pedido está sendo separado e a previsão atual de entrega é XX/XX.

Assim que sair para entrega eu aviso por aqui. 🚚

**Depois da entrega:**

**Agente:**  
Seu pedido foi entregue. ✅

Os tamanhos serviram corretamente?

```
👍 Sim, ficaram bons
👕 Uma peça ficou pequena
👕 Uma peça ficou grande
```

Essa pergunta alimenta **Meu Tamanho** / “Meu uniforme”.

**Se:** Camiseta 12 ficou pequena.

**Agente:**  
Entendi.

Temos camiseta 14 disponível.

Quer solicitar a troca?

```
🔄 Sim, trocar pela 14
📏 Quero conferir as medidas primeiro
```

---

### 4.5 🎉 Meus benefícios

Junta **Rede Circular (2→1)** + **Compartilhe e Ganhe (indicação)** no mesmo placar.

**Usuário:** 🎉 Meus benefícios

**Agente:**  
Olá, Maria! 💙 Aqui está seu saldo de benefícios:

**♻️ Rede Circular**  
3 peças cadastradas  
2 doações concluídas ✅  

🎁 1 camiseta conquistada

**👨‍👩‍👧 Compartilhe e Ganhe**  
9 pessoas acessaram seu link  
4 se cadastraram  
2 fizeram compras confirmadas ✅  

🎁 2 camisetas conquistadas

**Total disponível:** 👕 3 camisetas

```
👕 Escolher tamanhos
🔗 Ver meu link
📲 Compartilhar meu link
📊 Ver minhas indicações
♻️ Ver minhas doações
```

**Se “Ver meu link”:**

**Agente:**  
Este é seu link:

`espacolivre.com.br/i/MARIA4827`  
*(produto: domínio oficial do site + `/i/[codigo]`)*

As compras elegíveis de novos clientes diretamente indicados por você ficam vinculadas ao seu cadastro.

```
📲 Compartilhar no WhatsApp
```

O sistema prepara a mensagem pronta para encaminhar.

---

### 4.6 👕 Meu uniforme (evolução)

```
Tamanhos cadastrados

Camiseta: 12 ✅ confirmado
Shorts: 12 ✅ confirmado
Calça: 14 ✅ confirmado
Blusão: 14

Última atualização: há 4 meses.
```

```
📏 Atualizar tamanhos
🛍️ Montar kit
🎁 Procurar doação
```

Junta a inteligência acumulada (compra, doação, pós-venda “serviu?”).

---

## 5. O que acontece por trás (CRM progressivo)

Nenhuma conversa precisa *parecer* um formulário. Ao longo do uso o sistema descobre:

```
telefone
  → nome
  → escola
  → bairro
  → peças procuradas
  → tamanhos
  → doações
  → compras
  → preferência de entrega
  → tamanhos confirmados (serviu?)
  → indicações
  → recompensas
```

Isso alinha com a régua de camadas em `modelo-de-negocio.md` §4.2: WhatsApp identifica; cada intenção enriquece o lead; CPF/endereço/pagamento só quando necessário.

---

## 6. Limitações (não esquecer no desenho)

| Limite | Impacto |
|--------|---------|
| Janela 24h Meta | Fora dela, só templates aprovados (alertas, nudges) |
| Botões / listas | Poucos botões por mensagem; listas com limite de itens |
| Feed visual | Site melhor para muitas opções; WA manda 3–5 + link filtrado |
| Pagamento no BR | Sem WhatsApp Pay completo → link de checkout / operação |
| Kits muito complexos | Preferir site com carrinho pré-montado |
| Custo de templates | Alertas em massa podem pesar — agregar ou linkar site |

---

## 7. Implementação

1. **Mesma lógica de negócio** do site (RPCs / server actions) — o agente é só outra interface.
2. Webhook Meta Cloud API + estado de conversa.
3. Menu estruturado (MVP) → depois linguagem natural opcional (IA + ferramentas).
4. Templates aprovados: alerta “surgiu peça”, interessado na doação, status de pedido, nudge compra.
5. Handoff humano quando o bot não resolver.
6. Links profundos para o site (`/doacao/receber?…`, carrinho, `/i/[codigo]`, `/conta`).

**MVP sugerido para validar fricção:** doar · cadastrar “procuro” · alerta + pedir peça · aceitar/confirmar doação. Medir conclusão vs. mesmos fluxos no site.

### 7.1 Etapa 1 — fundação (feita)

Nada disso conversa com o usuário final: é o que permite o WhatsApp escrever no
mesmo banco que o site lê.

| Peça | Onde |
|------|------|
| Identidade como parâmetro no banco | `supabase/migrations/0005…`, `0006…` |
| Estado da conversa + idempotência | `supabase/migrations/0007_agente_conversa.sql` |
| Comandos compartilhados (site + agente) | `src/lib/comandos/` |
| Cliente `service_role` | `src/lib/supabase/admin.ts` |
| Ponte da Meta (graph, assinatura, envio, payload) | `src/lib/whatsapp/` |
| Webhook | `src/app/api/whatsapp/webhook/route.ts` |
| Server actions viraram wrappers finos | `src/app/doacao/acoes.ts`, `src/app/conta/acoes.ts` |

**Padrão do banco (uma regra, duas portas):**

- `interno.X(p_uid, …)` — corpo único da regra.
- `public.X(…)` — porta do site, passa `auth.uid()`. Assinatura inalterada.
- `public.X_como(p_uid, …)` — porta do agente, `execute` só para `service_role`.

**Decisões tomadas nesta etapa:**

- Estado da conversa no Postgres, não em memória (Render hiberna e reinicia).
- `agente_mensagem` deduplica: a Meta reentrega webhook e um retry publicaria anúncio duas vezes.
- Telefone comparado com e sem o nono dígito — o `wa_id` da Meta e o `auth.users.phone` divergem em número antigo.
- Conta criada pelo WhatsApp entra com telefone confirmado (a mensagem prova posse do número), mas só quando o fluxo exigir conta.
- Webhook responde 200 depois de validar a assinatura, para a Meta não reenviar por erro nosso.

### 7.2 Etapa 2 — menu + procurar + alerta (feita)

O agente passa a responder. Quem fica no WhatsApp grava no mesmo banco que o site lê (`perfil`, `filho`, `procuro`, `doacao`).

| Peça | Onde |
|------|------|
| Menu (Procurar / Doar / Benefícios) | `src/lib/whatsapp/menu.ts` |
| Fluxo procurar doação | `src/lib/whatsapp/fluxos/procuro*.ts` |
| Placar resumido | `src/lib/whatsapp/fluxos/beneficios.ts` |
| Alerta ao publicar anúncio | `src/lib/whatsapp/alerta.ts` (chamado por `publicarAnuncio`) |

**Como o fluxo abastece o site**

1. Consulta o feed **antes** de pedir cadastro (`contar_anuncios_ativos`).
2. Se não há peça: lista de espera → `procuro` (telefone + modelo + tamanho).
3. Se há peça: nome + escola → `perfil` / `filho`, depois opções. Pedir chama `pedir_peca`.
4. “Ver todas” abre `/doacao/receber` já filtrado.
5. Doar no menu ainda aponta para o site (`/doacao/doar`) — foto no chat é etapa 3.

**Alerta:** qualquer anúncio novo (site ou WhatsApp) dispara `avisarQuemProcura`. Dentro de 24h da última mensagem, texto + botões. Fora da janela, template `WHATSAPP_ALERTA_TEMPLATE` (2 variáveis: peça, tamanho). Sem template, o aviso fica para a próxima conversa — o anúncio **não** falha.

**Adaptação em relação à simulação §4.3:** o anúncio tem `escola`, não bairro. A proximidade usa escola quando o lead já informou; bairro continua fora do modelo.

### 7.3 Próximas etapas

| Etapa | Escopo |
|-------|--------|
| 3 | **Doar** com foto (download de mídia da Meta → Storage) + aceitar/confirmar no chat |
| 4 | Benefícios mais ricos (resgatar, compartilhar link pronto) |
| 5 | Compra e kit (fecha com operação até existir checkout online) |
| Depois | Pedido/logística e “Meu uniforme” — dependem de modelo de dados novo (§8) |

---

## 8. Prontidão dos fluxos (especificação ≠ pronto)

As simulações do §4 são a especificação alvo. Parte delas já tem apoio no banco;
parte pede modelo de dados novo. Marcar isto evita prometer no chat o que não
existe no produto.

| Fluxo | Prontidão | Falta |
|-------|-----------|-------|
| §4.3 Procurar doação | **Feito (etapa 2)** | Bairro (anúncio casa por escola) |
| §4.5 Meus benefícios | **Resumo feito (etapa 2)** | Resgate e compartilhar mensagem pronta |
| §4.2 Doar | **Link para o site (etapa 2)** | Foto no chat + aceitar/confirmar — etapa 3 |
| Aceitar / recusar / confirmar | **Construível (etapa 3)** | RPCs prontas; ainda não há conversa de doador |
| Etiquetas | **Construível hoje** | Nada — `POST /api/solicitacao` é stateless |
| §4.1 Comprar | **Parcial** | Sem estoque real (`DISPONIBILIDADE` vazio) e sem checkout online; fecha com a operação |
| Kit → “revisar e finalizar” no site | **Parcial** | Carrinho vive em `localStorage`; precisa persistir para o link funcionar |
| §4.4 Meu pedido | **Depende de modelo novo** | `compra` não tem itens, número, status logístico nem entrega |
| §4.6 Meu uniforme | **Depende de modelo novo** | `filho.tamanho_atual` é um texto único; falta tamanho por peça + data da medição |
| Pós-venda “serviu?” | **Depende de modelo novo** | Depende de pedido existir |

---

## 9. Relação com outros documentos

| Documento | Papel |
|-----------|--------|
| [`modelo-de-negocio.md`](./modelo-de-negocio.md) | Hub; este canal é extensão dos 3 caminhos |
| [`recompensas.md`](./recompensas.md) | 2→1 e indicação (textos do placar no WA) |
| [`etiquetas-qr-decisoes.md`](./etiquetas-qr-decisoes.md) | Etiquetas podem entrar no menu depois |
| Este arquivo | UX conversacional, divisão site×WA, simulações, prontidão |
