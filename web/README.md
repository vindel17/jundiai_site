# Uniforme Jundiaí — MVP (etiquetas)

Landing + formulário de etiquetas gratuitas + CRM em Google Sheets + botão WhatsApp.

- Domínio: `uniformejundiai.com.br`
- Rota principal: `/etiquetas`
- Cidade: Jundiaí-SP

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Google Sheets (CRM)
- ViaCEP (autocomplete de endereço)
- Deploy preparado para Render (`render.yaml`)

## Desenvolvimento

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000/etiquetas](http://localhost:3000/etiquetas).

Sem as variáveis do Google Sheets, as solicitações são gravadas em fallback de desenvolvimento (console + memória do processo).

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número com DDI, ex.: `5511999999999` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics (opcional) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel (opcional) |
| `GOOGLE_SHEETS_ID` | ID da planilha |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | E-mail da service account |
| `GOOGLE_PRIVATE_KEY` | Chave privada (com `\n`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública `sb_publishable_...` (projetos antigos: `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SEND_SMS_HOOK_SECRET` | Segredo do hook, formato `v1,whsec_...` |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número na Meta Cloud API |
| `WHATSAPP_ACCESS_TOKEN` | Token permanente do app da Meta |
| `WHATSAPP_OTP_TEMPLATE` | Nome do template de autenticação |
| `WHATSAPP_OTP_LOCALE` | Idioma do template, ex.: `pt_BR` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta — só o agente do WhatsApp usa (nunca no bundle) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token que você inventa e repete no painel da Meta |
| `WHATSAPP_APP_SECRET` | App Secret da Meta — valida a assinatura do webhook |
| `WHATSAPP_AGENTE_ECO` | `1` liga o eco de diagnóstico do webhook (vazio em produção) |
| `WHATSAPP_VOUCHER_TEMPLATE` | Nome `voucher_2027_liberado` para ativar o envio do aviso do voucher |

Sem as variáveis do Supabase, o site continua funcionando (venda + etiquetas); só as
rotas de conta ficam indisponíveis.

### Configurar login por WhatsApp

O Supabase gera e valida o código; nós só entregamos a mensagem pelo WhatsApp.

1. **Banco:** as migrações de `supabase/migrations/` já podem ser aplicadas pelo
   MCP (ou coladas no SQL Editor, **em ordem numérica**, de `0001` a `0007`).
2. **Telefone:** o painel exige um *SMS provider* para ligar o Phone — sem isso o
   toggle não salva. **Não precisa de Twilio de verdade** para desenvolver:

   1. Em *Authentication → Sign In / Providers → Phone*, escolha **Twilio**
      (não Twilio Verify).
   2. Preencha com valores só no formato certo (não enviam SMS de verdade):
      - Account SID: `ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
      - Auth Token: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
      - Message Service SID: `MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
   3. Ligue **Enable Phone provider** e salve.
   4. Em *Test phone numbers and OTPs*, cadastre o seu número **sem o +** e um
      código fixo, ex.: `5511999999999=123456`. Salve de novo.

   No site, entre com `(11) 99999-9999` e o código `123456`. O Auth aceita o
   número de teste e **não chama** o Twilio.

   Produção (WhatsApp): em *Authentication → Hooks*, crie um **Send SMS Hook**
   HTTPS apontando para `https://SEU_DOMINIO/api/auth/whatsapp-otp`. Com o hook
   ligado, os campos do Twilio ficam desnecessários. Copie o segredo para
   `SEND_SMS_HOOK_SECRET`.
3. **Template na Meta:** crie um template categoria `AUTHENTICATION` com botão
   `OTP` do tipo `COPY_CODE`, idioma `pt_BR`. Guarde o nome em
   `WHATSAPP_OTP_TEMPLATE`. A aprovação costuma sair em minutos; a conta
   WhatsApp Business API em si leva dias.

### Configurar o webhook do agente (canal WhatsApp)

O webhook responde com o menu (Procurar doação, Doar, Meus benefícios). Detalhe
dos fluxos em `whatsapp-agente.md` §7.

1. Aplique as migrações `0005` a `0007` e preencha `SUPABASE_SERVICE_ROLE_KEY`.
2. Na Meta (*App → WhatsApp → Configuration → Webhook*), aponte a URL de callback
   para `https://SEU_DOMINIO/api/whatsapp/webhook` e use o mesmo valor de
   `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Assine o campo `messages`.
3. Copie o **App Secret** (*Settings → Basic*) para `WHATSAPP_APP_SECRET` — sem
   ele toda requisição é recusada com 401.
4. Mande “oi” para o número: deve chegar o menu. `WHATSAPP_AGENTE_ECO` não é
   mais necessário.

### Aviso da liberação do voucher de 2027

1. Aplique a migração `0014_aviso_voucher.sql` antes de publicar o site.
2. O modelo `voucher_2027_liberado` usa português do Brasil e corpo fixo,
   reproduzido na tela de avisos. Confira a aprovação no Gerenciador do WhatsApp.
3. Valide o modelo e os estados de entrega com um número autorizado de teste.
   O texto anuncia a liberação do crédito. Use um ambiente de teste ou aguarde
   a liberação oficial para usar esse texto em uma mensagem real.
4. Para habilitar o painel de envio, defina `WHATSAPP_VOUCHER_TEMPLATE=voucher_2027_liberado`.
   Em `/equipe/avisos`, a administração confere o total e prepara a fila após a
   liberação oficial. O envio é confirmado por lote. O painel mostra a aceitação
   pela Meta, a entrega e as falhas. Avisos incertos ficam fora do reenvio.
5. Reservas antigas entram no público após a família pedir o aviso no site ou
   mandar `QUERO O AVISO` no WhatsApp. `PARAR` cancela a autorização.

### Configurar Google Sheets

1. Crie uma planilha no Google Drive.
2. Crie uma aba chamada **`Solicitacoes`** (pode ficar vazia).
3. No Google Cloud, crie uma Service Account e baixe o JSON.
4. Compartilhe a planilha com o e-mail da service account (editor).
5. Preencha as variáveis no `.env.local` / Render.

## Regras do brinde (código)

- 5 etiquetas por filho
- Até 3 filhos por solicitação
- Envio pelos Correios (cidade fixa: Jundiaí-SP)
- Lista de escolas em `src/data/escolas.ts` — atualize com a lista oficial antes do go-live

## Tracking de campanha

Exemplos:

- `/etiquetas?origem=escola-central`
- `/etiquetas?utm_source=instagram&utm_medium=bio&utm_campaign=etiquetas`

## Deploy (Render)

1. Conecte o repositório e use o diretório `web` (ou o Blueprint `render.yaml`).
2. Configure as variáveis de ambiente.
3. Aponte o domínio `uniformejundiai.com.br` para o serviço.
4. Next.js já usa `PORT` automaticamente no `next start`.

## Próximas ondas (fora deste MVP)

Catálogo, Mercado Pago, pontos com geolocalização, área do cliente, voucher.
