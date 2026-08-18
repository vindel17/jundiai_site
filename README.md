# Uniforme Jundiaí

Operação de uniformes escolares da Espaço Livre para a rede municipal de Jundiaí-SP.

## Documentos

| Arquivo | Papel |
|---------|--------|
| [`modelo-de-negocio.md`](./modelo-de-negocio.md) | Hub: estratégia, caminhos, identidade, fases |
| [`whatsapp-agente.md`](./whatsapp-agente.md) | Canal WA: menu, simulações, divisão site×chat |
| [`recompensas.md`](./recompensas.md) | Mecânicas: 2→1, indicação, prova de conclusão |
| [`fase-voucher.md`](./fase-voucher.md) | Plano operacional: capacidade, giro, credenciamento |
| [`etiquetas-qr-decisoes.md`](./etiquetas-qr-decisoes.md) | Produto etiqueta/QR, achados, fases |
| [`site`](./site) | PRD de páginas — **parcialmente desatualizado** (ver aviso no topo) |

## Projeto

O app está em [`web/`](./web) (Next.js: páginas + APIs + agente WhatsApp).  
Banco, login e fotos: **Supabase** (não sobe no Render).

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

## Render

Blueprint: [`render.yaml`](./render.yaml) na raiz (`rootDir: web`).  
Conecte o repo [vindel17/jundiai_site](https://github.com/vindel17/jundiai_site) ao projeto Render e preencha as env vars (nunca commitar `.env.local`).

MVP atual: funil de pedido + doação + etiquetas + agente WhatsApp.
