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
- Armazenamento local para demonstração e suporte a S3 configurado no servidor.
- Hash e snapshot de integridade locais. A integração com Solana Attestation Service não está ativa; nenhuma transação Solana é enviada.

## Persistência e publicação

Sem configuração de S3, PDFs e metadados são gravados no disco local em `data/`. A fila e os consentimentos usam arquivos JSON, enquanto parte dos casos fica no `localStorage` do navegador. Isso serve para desenvolvimento em uma única instância, mas não oferece persistência compartilhada adequada para funções serverless.

O projeto pode ser importado na Vercel para testar a interface e o build. Para persistir uploads na Vercel, é necessário migrar PDFs para armazenamento de objetos (por exemplo, S3 privado ou Vercel Blob), metadados para um banco compartilhado e usar upload direto do navegador para arquivos acima do limite da Function. Veja [DEPLOYMENT.md](DEPLOYMENT.md) e [PATIENT_UPLOAD.md](PATIENT_UPLOAD.md).

## Configuração local

Copie `.env.example` para `.env.local` e preencha apenas as configurações que for usar. Credenciais reais não devem ser commitadas. O suporte S3 usa variáveis `AWS_*` no servidor; nunca exponha credenciais AWS ao navegador.

## Limites

O armazenamento local e a fila JSON não devem ser usados como solução de produção multi-instância. Use apenas dados sintéticos até configurar armazenamento persistente, controles de acesso e os requisitos de privacidade aplicáveis. A verificação mostrada atualmente é local e não constitui atestação regulatória ou transação blockchain.
