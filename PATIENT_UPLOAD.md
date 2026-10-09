# Envio do exame pelo WhatsApp

## Objetivo

O paciente recebe um link específico para o caso. Ao abrir o link, pode selecionar o PDF do exame e enviar o arquivo ao IASX. O botão do WhatsApp abre uma conversa com o número configurado e inclui o link de envio.

## Configuração

1. Defina o número do WhatsApp que receberá os links:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

2. Defina a URL pública do IASX:

```bash
NEXT_PUBLIC_APP_URL=https://iasx.exemplo.com
```

3. Reinicie o servidor.

## Fluxo

1. O usuário gera ou recebe o link `/patient-upload/{caseId}`.
2. O paciente abre o link pelo WhatsApp.
3. Escolhe o PDF do exame.
4. O sistema valida o tipo, o tamanho e calcula SHA-256.
5. O arquivo é persistido em S3/KMS ou, sem S3 configurado, em `data/uploads/{caseId}` no servidor.

> Este fluxo é para demonstração. O acesso real deve incluir autenticação, token temporário, consentimento e uma política de retenção adequada.

## Acesso pela Internet

O link usa o domínio pelo qual a página foi aberta. Para pacientes fora da rede local, publique o aplicativo em HTTPS ou exponha-o através de um túnel HTTPS persistente. O endereço `localhost` e endereços privados como `192.168.x.x` não são acessíveis pela Internet.

O armazenamento local serve apenas para testes em uma única instância persistente. Em produção ou implantação com múltiplas instâncias, configure S3; arquivos gravados no disco local podem não sobreviver a reinícios ou novos deploys.
