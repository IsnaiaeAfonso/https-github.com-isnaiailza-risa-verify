# IASX Clinical Review — POC com integração segura para armazenamento

O IASX é um protótipo de revisão clínica assistida que organiza documentos, extrai
textos, compara evidências, sinaliza conflitos e lacunas, e produz um resumo documental
para revisão humana. O fluxo atual usa dados fictícios e armazenamento local para a
demonstração. A API de documentos também suporta S3 quando `AWS_S3_BUCKET` está
configurado.

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
3. **Novo caso** (`/cases/new`) — nome do caso + upload de PDFs (drag & drop), extração local e envio seguro à API.
4. **Armazenamento híbrido** (`/api/documents`) — modo local quando o S3 não está configurado; S3 + KMS quando `AWS_S3_BUCKET` e `AWS_KMS_KEY_ID` estão definidos.
5. **Análise simulada** (`/cases/[id]/analyzing`) — checklist sequencial animado, avança sozinho.
6. **Clinical Review** (`/cases/[id]/review`) — contadores, e abas: Visão geral (achados com evidência), Timeline (gráfico de tendência + linha do tempo), Conflitos, Lacunas e Revisão estruturada (JEV).
7. **Painel de conflito** — modal centralizado ao clicar em um conflito: documento, página, trecho original vs. informação conflitante.
8. **JEV** — incorporado na aba "Revisão estruturada" da Clinical Review: necessidade de revisão humana, prioridade e clareza por item.
9. **Revisão profissional** (`/cases/[id]/professional-review`) — um item por vez (achado ou conflito), com paginação e ações confirmar / corrigir / rejeitar.
10. **Atestação** (`/cases/[id]/attestation`) — revisão concluída, checklist de integridade, selo "Solana Devnet" e transaction ID simulado, que deve ser substituído por uma transação real antes do uso clínico.
11. **Verificação** (`/cases/[id]/verify`) — certificado de verificação com checklist ATTESTED e dados da transação.
12. **Wiki IA** (`/wiki`) — arquitetura, segurança, governança e limites do produto.
13. **Segurança** (`/security`) — modelo de armazenamento, KMS, hash, controle de acesso e configuração AWS.

A barra lateral escura (Dashboard / Novo caso / Meus casos / Configurações) e a barra superior ficam
fixas em todas as telas autenticadas.

## Estrutura

- `lib/types.ts` — modelo de domínio (caso, documento, achado, conflito, lacuna, JEV, atestação).
- `lib/mockData.ts` — dados clínicos fictícios usados na demonstração.
- `lib/store.tsx` — store client-side (Context + `localStorage`) que simula o ciclo de vida de um caso.
- `components/` — `AppShell` (sidebar + topbar), `CaseHeader`, `ConflictModal`, `TrendChart`, primitivas de UI (`ui.tsx`).
- `app/` — rotas do App Router, uma por etapa do fluxo.

## Configuração AWS

```bash
cp .env.example .env.local
# Preencha AWS_S3_BUCKET e, quando necessário, AWS_KMS_KEY_ID.
```

O backend usa o AWS SDK no servidor, calcula SHA-256 e envia o conteúdo para o S3.
O cliente nunca recebe credenciais AWS. Sem configuração do bucket, o endpoint retorna
um resultado local e o fluxo continua operando no modo de demonstração.

## Aviso

O IASX Clinical Review, nesta demonstração e na visão de produto, organiza e sinaliza
informações de documentos — **não realiza diagnóstico, prescrição ou recomendação
médica**. Todos os dados clínicos usados são fictícios. A atestação Solana do POC é
simulada e não deve ser considerada uma prova regulatória ou uma transação real.
