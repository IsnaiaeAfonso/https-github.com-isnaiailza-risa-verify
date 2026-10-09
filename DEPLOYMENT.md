# Private Self-Hosted Deployment

This deployment runs one persistent Next.js instance behind Caddy HTTPS. It is intended for a private demonstration, not production handling of real patient data. The physician portal uses HTTP Basic Authentication; patient upload and consent pages remain public by design.

## Do zero ao deploy

### Sem comprar domínio

Se já houver um VPS com IP público fixo, para uma demonstração gratuita use um hostname de conveniência como `<IP-com-pontos>.nip.io` (exemplo: `203.0.113.10.nip.io`) no comando `npm run deploy:setup`. O Caddy tentará ativar HTTPS para esse hostname. `nip.io` é um serviço DNS de terceiro, não é um domínio controlado pelo produto e pode mudar; o endereço também deixa de apontar certo se o IP do VPS mudar. Não use esse caminho para documentos reais ou serviço clínico.

### Com domínio próprio

- Registre `risaverify.com.br` em um registrador de domínios. Confirme o preço de renovação, habilite MFA na conta e use proteção de dados do titular se o registrador oferecer.
- Contrate um VPS Ubuntu LTS com IP público fixo, pelo menos 2 vCPU, 4 GB RAM e 40 GB de disco para o protótipo. Escolha a região mais próxima dos médicos e verifique backups e suporte do provedor.
- No painel do domínio, crie um registro `A` para o domínio apontando ao IP público do VPS. Não crie `AAAA` até haver IPv6 configurado no VPS.
- Instale Docker Engine e o plugin Docker Compose no VPS conforme a documentação oficial da distribuição.
- Inbound TCP ports 80 and 443 available for automatic TLS certificates.
- A unique portal password and patient upload identity secret, generated and stored outside source control.

## Gerar segredos e configurar

1. Neste computador, execute `npm run deploy:setup` e informe o domínio próprio ou hostname `nip.io`, além do nome do médico. O assistente gera uma senha exclusiva e cria `.env.production` com permissão local restrita. Guarde a senha em um gerenciador; não a envie no chat.
2. Transfira o código ao VPS por um repositório privado ou `rsync` via SSH. Nunca transfira `.env`, `.env.production`, chaves privadas ou a pasta `data` por um repositório público.
3. No VPS, coloque `.env.production` na pasta do projeto com permissão `600`, pertencente ao usuário que executará Compose. Confirme o hostname configurado com `dig +short <hostname>`; ele deve resolver para o IP do VPS.
4. Se usar S3, configure bucket, região e criptografia com uma identidade de servidor de privilégio mínimo. Não coloque credenciais AWS em variáveis `NEXT_PUBLIC_*`.
5. Inicie com `docker compose --env-file .env.production up -d --build`.
6. Verifique `docker compose --env-file .env.production ps` e `curl https://<hostname>/api/health`.

The `risa_data` Docker volume preserves PDFs, consents and the demo document queue across container restarts and image upgrades. Back it up with an encrypted, access-controlled backup process. Caddy stores TLS state in its own persistent volumes.

## Access model and limitations

- The physician portal, doctor document list and PDF retrieval endpoints require HTTP Basic Authentication. The username is `risa`; use the configured `PORTAL_ACCESS_PASSWORD`.
- Patient upload pages and consent/upload APIs are public so patients can submit files. Keep case identifiers non-sensitive and use only intended upload links.
- The case-review store remains browser-local (`localStorage`) and is not shared among doctors or devices. Uploaded documents are server-persisted, but this does not make the full clinical workflow a multi-user system.
- Filesystem JSON stores are suitable only for the single app container shown here. Do not scale app replicas. A future multi-instance deployment must migrate consent and queue metadata to a transactional shared database.
- Do not use real patient documents until authentication, authorization, retention, audit, backup, security review, and applicable legal/privacy requirements have been independently assessed.

## Operations

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f app caddy
docker compose --env-file .env.production pull caddy
docker compose --env-file .env.production up -d
```

Keep the VPS patched, restrict SSH, configure firewall access to only SSH/HTTP/HTTPS as needed, rotate credentials if exposed, and verify encrypted backups and restore procedures.