# RISA Verify

RISA Verify é um protótipo de revisão documental clínica. Organiza documentos,
sinaliza evidências, conflitos e lacunas e oferece um fluxo de revisão humana. Esta
versão é uma demonstração: os dados de casos são fictícios e o produto não realiza
diagnóstico, prescrição ou recomendação médica.

## Executar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Para validar a compilação de produção, execute `npm run build`.
O primeiro build precisa de acesso à internet para baixar as fontes via `next/font/google`.

## Funcionalidades

- Painel médico com casos, revisão profissional, resumo documental e configurações.
- Upload de PDF pelo fluxo do paciente, com consentimento, validação do arquivo e seleção do médico.
- Fila de documentos recebidos no portal médico, com acesso protegido por sessão.
- Interface em português e inglês.
- Armazenamento local para desenvolvimento, suporte S3 no servidor e caminho de produção Vercel com Blob privado para PDFs, metadados da fila e consentimentos.
- Hash e snapshot de integridade locais. A integração com Solana Attestation Service não está ativa; nenhuma transação Solana é enviada.

## Persistência e publicação

Em desenvolvimento local, PDFs e metadados podem ser gravados em `data/` usando arquivos JSON. Na Vercel, PDFs, fila e consentimentos usam um Blob privado conectado ao projeto; crie esse store antes de habilitar uploads. Parte dos casos/revisões permanece no `localStorage` do navegador e ainda não é compartilhada entre médicos ou dispositivos.

O upload para Vercel Blob é direto do navegador porque a Vercel limita o corpo de uma Function a 4,5 MB; o limite de arquivo da experiência é 25 MB. A fila JSON é armazenada como objetos privados, não em um banco transacional, e é adequada apenas a esta demonstração de baixa escala. Veja [DEPLOYMENT.md](DEPLOYMENT.md) e [PATIENT_UPLOAD.md](PATIENT_UPLOAD.md).

## Configuração local

Copie `.env.example` para `.env.local` e preencha apenas as configurações que for usar. Credenciais reais não devem ser commitadas. O suporte S3 usa variáveis `AWS_*` no servidor; nunca exponha credenciais AWS ao navegador.

## Limites

O armazenamento local e a fila JSON em Blob não devem ser tratados como uma solução clínica de produção multiusuário. Use apenas dados sintéticos até configurar controles de acesso, auditoria, retenção, banco transacional e os requisitos de privacidade aplicáveis. O hash/registro de revisão é local neste deploy; a integração SAS ainda não emite atestações nem transações Solana.
