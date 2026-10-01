# IASX Clinical Review — MVP de frontend (mock)

Protótipo navegável do fluxo de revisão clínica assistida. **Somente frontend**, com dados
totalmente fictícios e simulados em memória (React Context + `localStorage`). Não há backend,
integração com Claude, Jev real ou Solana real — tudo é interface e mock, pensado para uma demo
de ~3 minutos.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

> Os fontes usam `next/font/google` (IBM Plex Sans/Mono), então é necessário acesso à internet no
> primeiro build/dev para baixar as fontes.

## Fluxo implementado

1. **Login** (`/login`) — tela de acesso (painel escuro + formulário), sem autenticação real. Qualquer submit leva ao dashboard.
2. **Dashboard** (`/dashboard`) — cards de métricas (casos, achados, attested, revisão pendente) e tabela de casos recentes.
3. **Novo caso** (`/cases/new`) — nome do caso + upload de PDFs (drag & drop) em uma única tela, sem processamento real.
4. **Análise simulada** (`/cases/[id]/analyzing`) — checklist sequencial animado, avança sozinho.
5. **Clinical Review** (`/cases/[id]/review`) — contadores, e abas: Visão geral (achados com evidência), Timeline (gráfico de tendência + linha do tempo), Conflitos, Lacunas e Revisão estruturada (JEV).
6. **Painel de conflito** — modal centralizado ao clicar em um conflito: documento, página, trecho original vs. informação conflitante.
7. **JEV** — incorporado na aba "Revisão estruturada" da Clinical Review: necessidade de revisão humana, prioridade e clareza por item.
8. **Revisão profissional** (`/cases/[id]/professional-review`) — um item por vez (achado ou conflito), com paginação e ações confirmar / corrigir / rejeitar.
9. **Atestação** (`/cases/[id]/attestation`) — revisão concluída, checklist de integridade, selo "Solana Devnet" e transaction ID mockado (copiável).
10. **Verificação** (`/cases/[id]/verify`) — certificado "IASX VERIFICATION" com checklist ATTESTED e dados da transação.

A barra lateral escura (Dashboard / Novo caso / Meus casos / Configurações) e a barra superior ficam
fixas em todas as telas autenticadas.

## Estrutura

- `lib/types.ts` — modelo de domínio (caso, documento, achado, conflito, lacuna, JEV, atestação).
- `lib/mockData.ts` — dados clínicos fictícios usados na demonstração.
- `lib/store.tsx` — store client-side (Context + `localStorage`) que simula o ciclo de vida de um caso.
- `components/` — `AppShell` (sidebar + topbar), `CaseHeader`, `ConflictModal`, `TrendChart`, primitivas de UI (`ui.tsx`).
- `app/` — rotas do App Router, uma por etapa do fluxo.

## Aviso

O IASX Clinical Review, nesta demonstração e na visão de produto, organiza e sinaliza informações
de documentos — **não realiza diagnóstico, prescrição ou recomendação médica**. Todos os dados
clínicos usados são fictícios.
