# Upload do paciente para o portal médico

## Objetivo

O paciente recebe um link específico para o caso. Ao abrir o link, escolhe o médico na lista configurada, aceita o consentimento do caso e seleciona o PDF. O portal médico lista e abre o arquivo recebido pelo endpoint protegido.

## Configuração

1. Em **Vercel → Project → Storage**, crie um Blob store com acesso **Private** e conecte-o ao projeto e ao ambiente **Production**. A integração disponibiliza `BLOB_READ_WRITE_TOKEN` ao projeto.
2. Configure a lista de médicos em `PATIENT_UPLOAD_DOCTOR_NAMES` (nomes separados por vírgula). Se a variável estiver ausente, o protótipo usa a lista de demonstração de dez médicos em `lib/patientUploadConfig.ts`.
3. Defina o número do WhatsApp que receberá os links, se for usar esse botão:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

4. Defina a URL pública do RISA Verify, se for montar links fora do domínio atual:

```bash
NEXT_PUBLIC_APP_URL=https://iasx.exemplo.com
```

5. Faça um novo deploy depois de conectar armazenamento e variáveis.

## Fluxo

1. O usuário gera ou recebe o link `/patient-upload/{caseId}`.
2. O paciente abre o link pelo WhatsApp.
3. Escolhe o PDF do exame.
4. O sistema valida o consentimento e a seleção do médico antes de emitir uma autorização de upload curta para PDF de até 25 MB.
5. Na Vercel, o navegador envia o PDF diretamente ao Blob privado, evitando o limite de 4,5 MB da Function. O callback valida a assinatura PDF, calcula SHA-256 e grava a fila em JSON privado no mesmo Blob.
6. No portal médico, a lista filtra os documentos pelo médico; abrir um arquivo exige sessão e transmite o PDF pelo backend, sem expor uma URL pública do Blob.
7. Em desenvolvimento local, mantém-se o modo de disco local ou S3 configurado.

> O fluxo é uma demonstração. Use somente dados sintéticos até definir autenticação do paciente, autorização dos links por caso, retenção, auditoria, backups e revisão de privacidade apropriada. O consentimento atual é demonstrativo e a lista de médicos não equivale a cadastro/autenticação profissional.

## Acesso pela Internet

O link usa o domínio pelo qual a página foi aberta. Para pacientes fora da rede local, publique o aplicativo em HTTPS ou exponha-o através de um túnel HTTPS persistente. O endereço `localhost` e endereços privados como `192.168.x.x` não são acessíveis pela Internet.

O armazenamento local serve apenas para testes em uma única instância persistente. Na Vercel, sem Blob privado conectado, o upload é recusado claramente; disco local e JSON não são tratados como persistência. O RISA Verify ainda guarda parte dos casos/revisões no `localStorage` do navegador, então essa informação não é compartilhada entre médicos/dispositivos.
