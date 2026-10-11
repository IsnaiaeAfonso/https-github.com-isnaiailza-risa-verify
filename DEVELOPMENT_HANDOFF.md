# IASX Clinical Review — Documento de Continuidade do Desenvolvimento

**Finalidade:** servir como registro de continuidade entre sessões, máquinas, VS Code e colaboradores. Este documento explica o que o IASX pretende ser, o que existe no repositório, o que foi testado, as decisões já tomadas, os riscos conhecidos e o produto final a entregar.

**Estado deste registro:** 2026-10-05 (datas de logs de execução e do ambiente podem aparecer como 2026-10-06 por diferença de fuso horário).  
**Repositório de trabalho observado:** `cliniverify-minha-copia`.  
**Produto:** IASX Clinical Review (protótipo de revisão clínica assistida).  
**Regra de segurança:** até que a lista de critérios de produção deste documento esteja concluída, tratar a aplicação como demonstração com dados fictícios/de-identificados. Não carregar dados clínicos reais.

---

## 1. Resumo Executivo

O IASX Clinical Review é um protótipo web que organiza documentos clínicos, extrai texto de PDFs, encontra informações estruturadas com regras determinísticas, destaca possíveis divergências e lacunas, oferece revisão humana estruturada e registra uma atestação demonstrativa. Há uma experiência adicional para um paciente enviar um PDF associado a um caso e a um médico selecionado.

O repositório atual está em Next.js 14.2.35, React 18 e TypeScript. A interface possui páginas de dashboard, população, casos, envio/análise, revisão, atestação e verificação. O armazenamento do caso principal continua majoritariamente no navegador via `localStorage`; APIs do servidor aceitam upload e escrevem em disco no modo de demonstração ou enviam a S3 quando configurada.

O PDF enviado pela página do paciente é validado, recebe SHA-256 e uma entrada na fila JSON. O fluxo foi exercitado em ambiente local e por URL pública temporária Cloudflare Tunnel. Isso demonstra conectividade e upload da prova de conceito, não uma implantação de produção.

**Não declarar como pronto para uso clínico ou produção:** autenticação/autorização reais, persistência multiusuário, gestão de identidade, proteção de endpoints, fila distribuída, retenção/exclusão, monitoramento, recuperação de desastre, transação Solana real, validação regulatória e segurança operacional ainda não estão completos.

---

## 2. Visão do Produto Final

### 2.1 Objetivo

Entregar uma ferramenta de apoio à revisão documental clínica que ajude uma equipe autorizada a:

- receber documentos clínicos relacionados a um caso;
- armazenar os documentos com controles de acesso e criptografia;
- extrair conteúdo de PDFs com referência de documento e página;
- organizar fatos, datas, medições, achados, conflitos e lacunas;
- mostrar sempre a evidência original que sustenta cada sinalização;
- apoiar, sem substituir, o julgamento profissional;
- permitir que um profissional revise, confirme, corrija ou rejeite cada item;
- preservar trilha de auditoria e integridade dos documentos;
- gerar um resumo final e, se aprovado pelo modelo de governança, uma atestação verificável;
- receber documentos de pacientes por link seguro, com consentimento explícito e associação correta ao caso/profissional.

### 2.2 Limites do produto

O IASX organiza e sinaliza conteúdo documental. Não deve diagnosticar, prescrever, recomendar tratamento ou substituir profissional de saúde habilitado. Toda classificação automática deve ser apresentada como sinalização sujeita a revisão humana, com evidência rastreável, limitações visíveis e mecanismo para corrigir/rejeitar.

### 2.3 Entregáveis finais esperados

1. Aplicação web autenticada, com papéis e autorização por organização, usuário e caso.
2. Gestão de casos e documentos com persistência em banco de dados adequado e armazenamento de objetos privado.
3. Upload robusto de PDFs, incluindo mobile, validação de conteúdo, limite de tamanho configurável, progresso, repetição segura e confirmação inequívoca.
4. Pipeline assíncrono e observável de extração, análise e geração de resultados.
5. Análise documental explicável, com páginas, trechos, versão do extrator/regras e qualidade/confiança corretamente caracterizadas.
6. Revisão profissional com confirmações, correções, rejeições e justificativas auditáveis.
7. Resumo final imutável/versionado e comprovante de integridade verificável.
8. Consentimento com versão dos termos, finalidade, caso, paciente, horário, revogação e prova persistente.
9. Compartilhamento externo por URL HTTPS estável, curta duração e escopo mínimo; não por túnel temporário.
10. Observabilidade, alertas, backups, retenção, eliminação, resposta a incidentes e documentação operacional.
11. Testes automatizados unitários, de integração, de segurança e E2E desktop/mobile.
12. Avaliações de privacidade, segurança e requisitos regulatórios aplicáveis antes de qualquer uso com dados reais.

---

## 3. Tecnologias e Execução

### 3.1 Stack observada

- Next.js 14.2.35 com App Router.
- React 18.3.1 e TypeScript estrito.
- Tailwind CSS 3.
- `pdfjs-dist` para extração de PDF.
- AWS SDK v3 `@aws-sdk/client-s3` para armazenamento opcional em S3.
- `lucide-react` para ícones.
- SHA-256 no servidor para integridade do arquivo.
- Estado de casos/população no browser com `localStorage`.
- Fila JSON em `data/document-queue.json` e arquivos no modo demo em `data/uploads/...`.
- Consentimentos persistidos no modo demo em `data/consents.json`.

### 3.2 Comandos

```bash
npm install
npm run dev
npm run build
npm run start
```

Desenvolvimento local: `http://localhost:3000`. Para testar fora da máquina, `localhost` e IPs privados não servem. É necessário ambiente implantado, DNS/HTTPS ou túnel. Os Quick Tunnels são temporários, podem mudar de URL e não são deployment de produção.

O README observa que o primeiro build/dev pode precisar baixar fontes via `next/font/google`, logo requer acesso à Internet.

### 3.3 Configuração

Ver `.env.example`. Variáveis observadas:

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_PREFIX`
- `AWS_KMS_KEY_ID`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `PATIENT_UPLOAD_IDENTITY_SECRET`
- `PATIENT_UPLOAD_DOCTOR_NAMES`

A lista demo de dez nomes é configurada por `PATIENT_UPLOAD_DOCTOR_NAMES`; inclui Dr. Laura Santos e Dr. Theo Santos. Não copiar segredos do `.env` para documentação, issues ou commits. O `.env` é local e está presente no estado de trabalho observado; assegurar que jamais seja versionado.

---

## 4. Arquitetura e Mapa do Repositório

### 4.1 Rotas principais

- `/login`: tela de login demonstrativa; o README informa que não há autenticação real.
- `/dashboard`: visão geral/métricas e casos.
- `/dashboard/clinical`: dashboard clínico.
- `/dashboard/population`: painel agregado populacional.
- `/cases`: lista de casos.
- `/cases/new`: cria caso, recebe PDFs, faz upload via `/api/documents`, extrai texto localmente e inicia análise.
- `/cases/[id]/analyzing`: etapa de análise.
- `/cases/[id]/review`: achados, evidências, timeline, conflitos, lacunas e revisão estruturada/JEV.
- `/cases/[id]/professional-review`: decisão profissional item a item.
- `/cases/[id]/final-summary`: resumo final.
- `/cases/[id]/attestation`: atestação demonstrativa.
- `/cases/[id]/verify`: verificação do certificado/atestado.
- `/patient-upload/[caseId]`: página paciente; consentimento, seleção de médico e PDF.
- `/terms`, `/privacy`, `/security`, `/wiki`, `/configuracoes`: informação e configuração.

### 4.2 APIs

- `POST /api/consent`: cria registro de aceite ou cancelamento; `GET /api/consent?consentId=...`: lê consentimento.
- `GET /api/patient-upload`: retorna lista configurada de médicos e token demo.
- `POST /api/patient-upload`: verifica PDF, limite de 25 MB, consentimento, caso/termo e médico; calcula SHA-256, grava fila e salva no disco demo ou S3.
- `GET /api/documents`: retorna fila JSON.
- `POST /api/documents`: upload geral de documento; sem bucket S3 retorna resposta demo, não é o mesmo contrato do upload de paciente.

### 4.3 Módulos centrais

- `lib/types.ts`: modelos de caso, documento, evidência, achado, conflito, lacuna, evento, JEV e atestação.
- `lib/store.tsx`: Context de casos; atualmente estado client-side/localStorage.
- `lib/mockData.ts`: dados clínicos fictícios.
- `lib/pdfTextExtractor.ts`: extração de páginas de PDF.
- `lib/clinicalAnalyzer.ts`: regras para extração estruturada/determinística e comparação de fatos.
- `lib/clinicalAssistant.ts` e `components/ClinicalAssistant.tsx`: assistência clínica demonstrativa.
- `lib/cloudStorage.ts`: cliente para API `/api/documents`.
- `lib/documentQueue.ts`: persistência JSON da fila.
- `lib/consentStore.ts`: persistência JSON do consentimento demo.
- `lib/populationStore.ts`: dados agregados demo/client-side.

---

## 5. Histórico do Desenvolvimento

Este histórico combina commits disponíveis no Git e fatos de sessões de implementação/teste. O Git observado não contém commits separados para todos os ajustes recentes; há alterações locais não commitadas. Portanto, não atribuir cada alteração a commit específico sem verificar `git diff`/blame.

### 5.1 Marcos Git confirmados

1. `48bdeb8` — `Initial IASX Clinical Review MVP`: base inicial com rotas de revisão, análise, atestação, dashboard, novo caso, shell de aplicação, modelos de dados e mocks.
2. `2752310` — `feat: connect clinical PDF analysis flow`: conexão do fluxo de upload/análise de PDF, extrator, analisador, assistente, atualização de review, store e tipos.
3. `68776ca` — `fix: make PDF extraction build on Vercel`: correção de build/extração de PDF e configurações/dependências relacionadas.

Branch/HEAD observados: `isnaia/minhas-alteracoes`, alinhado naquele momento com `origin/feat/cliniverify-flow`. Verificar branch remota antes de sincronizar; não fazer reset ou checkout destrutivo.

### 5.2 Marcos funcionais e decisões registradas durante o trabalho

1. A experiência de revisão clínica foi estendida com painel clínico, população, lista de casos, páginas informativas e conteúdo de wiki/segurança.
2. Foi criado fluxo de compartilhamento por link para paciente, incluindo tela de consentimento, identificação fictícia, lista de médico e envio de PDF.
3. A configuração inicial tinha IP privado `192.168...`; confirmado que esse endereço só é acessível na rede local. Links externos precisam de HTTPS público.
4. Upload de paciente foi corrigido para validar assinatura `%PDF-`, máximo 25 MB, calcular SHA-256 e persistir bytes em `data/uploads/{caseId}` quando S3 não está configurado. O fluxo remoto usa S3 e criptografia server-side AES256 ou KMS quando configurado.
5. A fila `data/document-queue.json` registra status `queued`, `stored` ou `failed`, provider, hash, tamanho, consentimento, médico e chave de objeto.
6. Médico selecionado foi conectado ao formulário e à validação do servidor; lista demo passou a conter exatamente dez profissionais incluindo Dr. Laura Santos e Dr. Theo Santos.
7. Um erro `403` foi rastreado à perda de consentimento após reinício do processo: antes, o consentimento ficava apenas num Map em memória enquanto o browser retinha o ID em localStorage. O demo agora grava e lê consentimentos em `data/consents.json`.
8. O seletor de PDF foi alterado para input nativo visível, para melhorar compatibilidade com iOS/mobile. A tela mostra arquivo e tamanho, permite trocar/remover e confirma o nome quando o envio termina.
9. O botão de aceite foi deixado disponível para clique; a rotina ainda valida os campos e exibe orientação quando necessário.
10. Um URL localtunnel mostrou tela “You are about to visit”; substituído por Cloudflare Quick Tunnel que encaminha direto para o IASX. URL anterior é efêmera e não é contrato estável.

### 5.3 Verificações executadas e resultados observados

- `npm run build` passou repetidamente após as mudanças descritas, incluindo build final do seletor mobile e do consentimento persistente.
- Endpoint de configuração `/api/patient-upload`: HTTP 200 e dez médicos, com Laura Santos e Theo Santos.
- Página paciente: HTTP 200; navegação aberta via browser e conteúdo visível.
- Teste mobile a 390 px: `scrollWidth` igual a `clientWidth`, input PDF visível e habilitado.
- Seletor do browser abriu; foi selecionado arquivo fictício existente no diretório demo; nome e tamanho apareceram e botão habilitou.
- Antes do fix de persistência: tentativa com consentimento antigo retornou `403` “É necessário aceitar...”. API confirmou que consent ID já não existia.
- Depois do fix: consentimento novo retornou `201`; leitura imediata retornou `200`; upload de PDF fictício retornou `202`, `queueStatus: stored`, provider `local-demo`, com object key em `data/uploads/...`.
- Upload com médico Dr. Theo Santos foi confirmado na entrada da fila.
- Não foi concluído teste real em aparelho físico iOS/Android nesta sessão; browser desktop em viewport mobile não substitui teste em dispositivo.

---

## 6. Estado Atual: Implementado, Parcial e Não Implementado

### 6.1 Implementado e demonstrado

- UI/rotas principais do POC.
- Fluxo de upload de PDF para caso, extração cliente e análise baseada em regras.
- Evidências com referências de documento/página na estrutura de dados.
- Revisão item a item e ações confirmar/corrigir/rejeitar.
- Resumo, atestação e verificação demonstrativos.
- Assistente demonstrativo e painel populacional de dados fictícios.
- Endpoint de upload de paciente, consentimento, seleção validada de médico, SHA-256 e fila JSON.
- Armazenamento local demo de PDFs e S3 opcional server-side.
- Retenção de consentimento demo em arquivo local após reinício.
- Seletor de PDF mobile nativo e visível.
- URL externa temporária via Quick Tunnel enquanto processos estão ativos.

### 6.2 Parcial / deve ser melhorado

- Upload geral e upload paciente têm caminhos/contratos separados e comportamentos diferentes.
- Fila do paciente é JSON local; ainda não há workflow operacional completo para transformar automaticamente a fila numa entidade/caso do `lib/store.tsx` de cada usuário.
- Caso principal guarda o estado no browser; sem backend de caso multiusuário.
- Consentimento é persistido como JSON demo, sem assinatura criptográfica, expiração ou revogação robusta, identidade autenticada ou registro transacional.
- A lista de médicos é variável de ambiente sem diretório de profissionais nem autorização por organização.
- O “upload para IASX” significa que o arquivo chega ao armazenamento/fila do IASX; não significa que ele está automaticamente submetido a pipeline clínico assíncrono persistente em produção.
- Gravação de arquivo e atualização de fila não são transacionais; uma falha pode deixar arquivo órfão ou fila incompleta.
- Escritas JSON não possuem lock/atomicidade contra uploads concorrentes.
- Erros de S3 retornam mensagem genérica ao cliente; logging precisa ser estruturado e sem dado sensível.
- Limite de arquivo pode diferir entre runtime, proxy e provedor de hospedagem; testar com PDFs de tamanhos representativos.
- Alguns textos/fluxos podem ficar inconsistentes entre consentimento antigo, estado local do browser e consentimento persistente do servidor.

### 6.3 Não implementado / não verificado

- Autenticação e autorização reais. A tela de login é demonstrativa.
- Segurança de link: token atual da API é fixo/demo (`patient-demo-link`); não usar publicamente para dados reais.
- Isolamento multi-tenant, RBAC, proteção CSRF/rate limiting/abuse detection.
- Banco de dados transacional para usuários, casos, profissionais, consentimentos e fila.
- Object storage de produção configurado e validado com credenciais IAM de menor privilégio.
- Download autorizado de PDF, URLs presigned e gestão de chaves de cliente.
- Pipeline de OCR para PDFs escaneados; extração do texto do PDF não equivale a OCR confiável.
- Análise clínica validada com especialistas, métricas de precisão/recall, calibração de confiança e benchmark.
- Integração FHIR/HL7 ou interoperabilidade hospitalar.
- Transação Solana real: a rede/transaction ID na atestação é simulado segundo o README.
- Retenção/eliminações com prova, backups e restauração.
- CI, suíte automatizada ampla, E2E em dispositivos e pentest.
- Avaliação jurídica/regulatória e aprovação para dados reais.
- Deployment persistente com domínio próprio; Quick Tunnel é efêmero.

---

## 7. Fluxos Operacionais Atuais

### 7.1 Novo caso e revisão clínica

1. Login demonstrativo.
2. Abrir `/cases/new`, incluir um rótulo fictício/de-identificado e escolher PDFs.
3. `uploadDocument` envia cada PDF a `/api/documents`.
4. `extractPdfText` extrai texto/páginas no cliente.
5. `lib/store.tsx` associa metadados e conteúdo extraído ao caso em estado local.
6. `analyzeClinicalDocuments` gera achados, timeline, conflitos e lacunas com regras.
7. Revisor abre o painel, consulta evidências e registra decisões.
8. Fluxo pode produzir resumo, atestação e página de verificação demonstrativa.

### 7.2 Envio do paciente

1. Abrir `/patient-upload/{caseId}`.
2. Obter lista de médicos via `GET /api/patient-upload`.
3. Selecionar médico e preencher identificação fictícia conforme UI atual.
4. Registrar aceite via `POST /api/consent`; o registro é salvo em disco demo.
5. Selecionar PDF (input nativo), revisar nome/tamanho.
6. Enviar `multipart/form-data` para `POST /api/patient-upload`, incluindo caso, médico, consentimento e versão de termos.
7. Backend valida assinatura e tamanho do PDF, consentimento/caso/termos e lista de médicos.
8. Calcula SHA-256, cria entrada de fila e salva em disco local ou S3.
9. UI informa envio; fila fica disponível por `GET /api/documents`.

**Interpretação importante:** `stored` confirma que o backend gravou o PDF no provider informado. No modo local demo, o arquivo fica na máquina/instância e não há replicação. Isso não assegura ingestão num serviço de produção ou revisão automática posterior.

---

## 8. Segurança, Privacidade e Uso de Dados

Este repositório está relacionado a dados clínicos. Respeitar minimização, finalidade e segurança desde desenvolvimento.

- Usar apenas dados sintéticos em desenvolvimento/testes públicos.
- Não colocar `.env`, credenciais AWS, PDFs de pacientes ou consentimentos em Git.
- Verificar `.gitignore` e histórico por segredos antes de publicar repositório.
- Não expor `data/uploads`, `data/consents.json` ou a fila via static hosting/web server.
- O servidor deve exigir autenticação e autorização por cada leitura/escrita em produção.
- Link do paciente deve ser aleatório, assinado, escopado ao caso, com expiração, revogação, limite de uso e rate limit.
- Consentimento deve registrar versão legal do texto, objetivo, escopo de compartilhamento, timestamp, meio de prova, status, revogação e vínculo seguro ao paciente/caso.
- Não enviar CPF ou outros identificadores em logs, metadata de bucket, analytics ou mensagens de erro. O UI atual diz que CPF fictício fica no navegador; verificar de novo qualquer mudança nesse fluxo.
- O nome do arquivo pode conter dados pessoais; sanitizar e evitar expô-lo em URL, logs públicos ou metadata desnecessária.
- PDF é conteúdo não confiável: validar magic bytes, tamanho, parser isolado, limites de CPU/memória, proteção contra arquivos maliciosos e política de retenção.
- Criptografia S3/KMS precisa ser verificada com política IAM/bucket, rotação, backup e logs. S3 server-side encryption não substitui controle de acesso.
- Fazer revisão de ameaça, privacy impact assessment e validação com jurídico/compliance antes de dados reais.

---

## 9. Plano de Continuidade Priorizado

### P0 — Estabilizar e tornar o upload confiável

- Adicionar testes automatizados às APIs de consentimento e upload: PDF válido, MIME incorreto, PDF falso, >25 MB, consentimento ausente/vencido/cancelado, caso/termo divergente, médico desconhecido, S3 indisponível.
- Testar upload físico em Safari iOS e Chrome Android, seleção Files/iCloud/Drive, interrupção de rede, retry e arquivos grandes.
- Corrigir consentimento cancelado/expirado na UI para pedir novo aceite em vez de estado inconsistente.
- Mostrar progresso, nome, tamanho, sucesso inequívoco, retry e erro acionável; evitar duplo envio/idempotência.
- Garantir que o estado persistente do consentimento e da fila funcione com múltiplos processos, reinício e falha parcial.
- Verificar contrato do upload geral `/api/documents` versus upload do paciente e escolher API/serviço comum sem regressões.
- Adicionar E2E cobrindo paciente -> PDF -> fila -> caso clínico/review, com fixture sintética.

### P1 — Persistência e backend de produto

- Definir banco (ex.: PostgreSQL) para usuários, organizações, casos, documentos, consentimentos, eventos de auditoria e jobs.
- Substituir JSON local por persistência transacional/migrations.
- Armazenar PDFs em bucket privado S3, política IAM mínima, KMS, criptografia em trânsito, lifecycle e versionamento conforme política.
- Criar worker/fila de jobs para extração/OCR/análise, estados explícitos, retry e dead-letter.
- Ligar upload do paciente ao caso real no backend e disponibilizar documento autorizado no workspace de revisão.
- Implementar download seguro (presigned URLs de curto prazo) e endpoint de leitura autorizado.
- Criar exclusão, retenção, exportação e trilha de auditoria.

### P2 — Identidade, governança e operação

- Implementar autenticação real (SSO/MFA conforme público-alvo) e autorização RBAC/ABAC.
- Isolar organizações/casos e profissionais; gerir lista real de médicos e permissões.
- Tokens de convite paciente curtos, de uso único/revogáveis e com escopo.
- Logs e métricas estruturados sem conteúdo clínico indevido; alertas, dashboards, tracing e runbooks.
- Backups criptografados e teste de restore; plano de continuidade e resposta a incidente.
- CI com lint/typecheck/build/test; secret scanning, dependency scanning e SBOM.
- Deploy persistente com domínio próprio, TLS gerido, ambientes dev/staging/prod separados.

### P3 — Qualidade clínica, conformidade e release

- Testar regras/assistente num dataset sintético de referência e com especialistas; medir falsos positivos/negativos.
- Exibir origem, página, trecho, método e limitações de cada resultado. Calibrar confiança ou remover linguagem que pareça probabilidade clínica validada.
- Fazer usabilidade/acessibilidade com revisores e testes mobile reais.
- Definir governance para revisão profissional, responsabilidades, consentimento, retenção e auditoria.
- Avaliar enquadramento regulatório e jurisdições alvo; não assumir que disclaimers bastam.
- Decidir se atestação blockchain é necessária. Caso sim, especificar ameaça/benefício, não registrar PHI on-chain, fazer threat model, implementar transação real, guardar somente hash/metadados mínimos e prover verificação independente.
- Criar release checklist, plano de suporte e critérios de rollback.

---

## 10. Critérios de Aceite do Produto Final

### Segurança e identidade

- Usuário não autenticado não acessa casos nem documentos.
- Um usuário/organização não lê nem altera dados de outra organização.
- Acesso a um PDF é autorizado em cada solicitação e auditado.
- Links públicos expiram, podem ser revogados, são escopados e não expõem IDs previsíveis.
- Nenhuma credencial, dado clínico ou identificador pessoal aparece em código, logs ou URLs.

### Upload e integridade

- PDF válido em mobile e desktop chega ao object storage privado.
- Arquivo inválido, excessivo ou não-PDF é rejeitado com mensagem clara.
- UI apresenta progresso, nome, tamanho e resultado; interrupção pode ser repetida sem duplicata.
- Hash recalculado no servidor corresponde ao arquivo armazenado e é preservado no audit trail.
- Consentimento existente é persistente, revogável e verificado para aquele caso e finalidade.
- Job de processamento pode reiniciar sem perder estado; falhas ficam visíveis e recuperáveis.

### Análise e revisão humana

- Cada afirmação derivada mostra fonte, página e trecho rastreável.
- Saída não é apresentada como diagnóstico nem recomendação.
- Profissional pode confirmar, editar ou rejeitar achados e registrar justificativa.
- Resumo final corresponde às decisões e documentos exatos daquela versão.
- O sistema nunca muda silenciosamente achado/documento depois da atestação.

### Operação e qualidade

- CI passa em lint/typecheck/build/test e E2E.
- Deploy, rollback, backup/restore, retenção e incident response foram ensaiados.
- Testes de segurança e privacidade foram revisados; riscos críticos fechados.
- Domínio HTTPS e storage persistente são independentes do laptop de desenvolvimento.
- Aprovações de produto, segurança, clínica e jurídico estão documentadas antes do uso real.

---

## 11. Como Outro VS Code Deve Retomar

1. Abrir a pasta do repositório e ler este documento, `README.md` e `PATIENT_UPLOAD.md`.
2. Verificar `git status`, branch e diffs antes de editar. Há alterações locais não commitadas no estado registrado; não executar reset/checkout destrutivo e não descartar arquivos do usuário.
3. Nunca abrir/copiar conteúdo secreto de `.env` para resposta, docs ou commits. Usar `.env.example` como modelo sanitizado.
4. Instalar dependências e executar `npm run build` para estabelecer baseline.
5. Conferir processos, `data/`, `.gitignore` e configuração de ambiente. Não assumir que URL de Cloudflare/localtunnel continua viva ou é a mesma.
6. Priorizar os itens P0; preservar o escopo demonstrativo e usar PDFs fictícios.
7. Antes de mexer em análise clínica, confirmar com o solicitante o comportamento esperado e acrescentar casos de teste com evidência rastreável.
8. Ao concluir uma tarefa, atualizar este handoff com data, arquivos, decisão, teste executado e limitações. O handoff é registro auxiliar; a implementação e os testes são a fonte de verdade.

### Estado Git observado no momento da escrita

- Branch reportada: `isnaia/minhas-alteracoes`.
- HEAD reportado: `68776ca` (`fix: make PDF extraction build on Vercel`).
- Foram observados arquivos modificados tracked em README, telas de login/dashboard/casos, shell, store, tipos e package manifests, além de numerosos arquivos novos (`app/api`, `app/patient-upload`, documentação, storage/queue/consent, dados etc.).
- Esse estado pode mudar após este documento ser salvo; sempre executar `git status --short` na nova sessão.
- Não se assumiu que o estado atual está integralmente commitado no branch remoto.

---

## 12. Glossário

- **Achado:** informação potencialmente relevante extraída de um documento, com evidência.
- **Conflito:** divergência entre fatos/documentos que merece avaliação humana.
- **Lacuna:** informação esperada ou necessária que não foi localizada.
- **JEV:** estrutura de revisão/avaliação humana representada no modelo do projeto.
- **Atestação:** registro de que um revisor completou uma etapa; no POC, a indicação Solana é simulada.
- **Object key:** identificador/localização do arquivo no provider de armazenamento; não deve por si só dar autorização de leitura.
- **Quick Tunnel:** URL HTTPS temporária que encaminha tráfego para máquina local; não é hospedagem permanente.
- **PHI/ dado de saúde:** dado pessoal referente à saúde; deve ser protegido segundo as leis e políticas aplicáveis.

---

## 13. Referências Internas

- `README.md`: visão geral e execução atual.
- `PATIENT_UPLOAD.md`: configuração e limites do link/fluxo do paciente.
- `app/api/patient-upload/route.ts`: validação e storage do PDF do paciente.
- `app/api/consent/route.ts` e `lib/consentStore.ts`: aceite e persistência demo.
- `lib/documentQueue.ts`: modelo/fila JSON demo.
- `app/patient-upload/[caseId]/page.tsx`: fluxo cliente de consentimento, médico e PDF.
- `app/cases/new/page.tsx`, `lib/cloudStorage.ts`, `app/api/documents/route.ts`: fluxo de criação de caso e upload geral.
- `lib/clinicalAnalyzer.ts`, `lib/pdfTextExtractor.ts`, `lib/types.ts`: extração, regras e modelos.
- `.env.example`: variáveis de ambiente sem valores de segredo.

---

## 14. Pesquisa do Crypto World’s Fair e Precedentes do Pitch

**Pesquisa consultada:** 6 de outubro de 2026, pelo Colosseum Copilot V2 e páginas públicas oficiais. Esta seção complementa o histórico técnico; não altera o escopo clínico nem prova demanda.

### 14.1 Programa e avaliação

- O registro privado de conta consultado mostra `IASX Clinical Review` inscrito no **Crypto World’s Fair**, com estado `draft`, sem track selecionada e sem teammates listados nesse registro. Isto não confirma submissão concluída.
- A página da campanha informa submissões até **12 de outubro de 2026**. A FAQ V2 retorna `2026-10-13T06:59:00Z`, equivalente à noite de 12 de outubro nas Américas. Confirmar hora local e estado final no formulário antes de submeter.
- A FAQ oficial “How will submissions be judged?” enumera founder–market fit, insight, produto/execução, potencial de mercado, comunicação, viabilidade e tração. A página da campanha enfatiza apresentar um produto inovador e executado.
- A FAQ “Are Colosseum hackathons only for new products, and who is eligible to win?” afirma que produtos podem ter iniciado antes, mas a avaliação considera o trabalho entre início e fim da competição; trabalho prévio relevante deve ser divulgado no formulário. Os commits conhecidos do IASX incluem `48bdeb8` em 30 set 2026 e `2752310`/`68776ca` em 3 out 2026, além de arquivos e artefatos que podem ser anteriores. Registrar essa história com precisão; não atribuir o produto inteiro ao período do hackathon.
- Fonte oficial da campanha: https://colosseum.com/worldsfair
- Critérios oficiais: https://colosseum.com/hackathon#h-faq-12
- Elegibilidade/trabalho prévio: https://colosseum.com/hackathon#h-faq-4
- Regras do evento (PDF): https://colosseum.com/legal/Crypto%20World's%20Fair%20Hackathon%20Rules.pdf

### 14.2 Precedentes vencedores estudados

Todos os três abaixo têm `award: winner` em registros Colosseum; são comparações temáticas e exemplos de pitch/produto, não evidência de que IASX terá tração. Prémios/placements são reconhecimentos do hackathon e não demonstram sucesso comercial.

- **CHRO+ — 4º lugar DePIN, Renaissance (início 4 mar 2024), $10,000 registrado:** projeto de sensores/dados fisiológicos e acesso para pesquisadores. Útil como precedente temático de saúde em Solana. A análise do repositório capturado em 25 set 2026 encontrou funcionalidades de transferências de recompensa e minting anunciadas, mas comentadas ou isoladas em rota sandbox; isto reforça que o pitch IASX deve separar interface/fluxo demonstrado de blockchain efetivamente executada. Página Colosseum: https://colosseum.com/projects/explore/chro%2B ; pitch: https://youtu.be/63IMGeum9t8 ; repo: https://github.com/haruom/chroplus-solana-web.
- **Echo — 2º lugar Undefined, Cypherpunk (início 25 set 2025), $20,000 registrado:** rede de especialistas para verificar claims científicas e ligar revisores a financiadores. Precedente de framing claro (claim + especialista + incentivo). O resumo de demo encontrou criação de pedidos/recompensas na Devnet, mas perfis de teste e o vídeo não demonstrou diretamente todo o fluxo de submissão de revisão. Lição para IASX: a demo ao vivo precisa fechar uma fatia operacional e mostrar seu estado real. Página: https://colosseum.com/projects/explore/echo ; pitch: https://www.loom.com/share/c2a75179e0fe4c03a72c1d99acad8a0e ; demo técnica: https://youtu.be/WrdGJGS5S8U.
- **Humanship ID — 5º lugar Undefined, Cypherpunk (início 25 set 2025), $5,000 registrado:** provas seletivas de identidade e controle de dados pelo usuário. Precedente para explicar privacidade como controle visível, com fluxo do usuário. A demo descrita depende de iOS, ePassport/NFC e sensores de liveness, uma restrição importante para onboarding. Página: https://colosseum.com/projects/explore/humanship-id ; demo: https://www.youtube.com/watch?v=FKZ9GC3Z0SI ; repo: https://github.com/Humanship/ids-manager.

### 14.3 Orientação incorporada ao pitch

- Frase/tese atual do deck: **“Cada revisão começa na fonte da evidência.”** A promessa específica é ligar PDF, trecho de origem e ação do revisor.
- Entrada de mercado é **hipótese**: equipes que organizam casos documentais longitudinais; pesquisa clínica é um potencial primeiro contexto a entrevistar, não um cliente ou canal comprovado.
- Modelo de receita é hipótese B2B — licença de equipe ou preço por caso — sem preço, TAM ou disposição a pagar afirmados. Validar quem usa, quem aprova e quem paga.
- Blockchain: hash SHA-256 do PDF existe no backend, mas a atestação Solana do POC é simulada. Próximo marco seria commitment canônico da versão revisada, verificado em Devnet. Nenhum PDF, PHI, identificador ou salt deve ser publicado on-chain.
- Métricas do deck são respostas/estados de teste técnico com dados sintéticos. Não são usuários, receita, economia de tempo, precisão clínica ou melhora de resultado.
- O upload do paciente é gravado na fila/armazenamento. Ele ainda não inicia automaticamente um pipeline assíncrono que cria/atualiza a entidade clínica client-side e processa o caso de ponta a ponta.
- O pedido do pitch foi tornado testável: acesso a revisores para entrevistas/testes, medir tempo para localizar evidência, itens confirmados/corrigidos/rejeitados e intenção de retorno. Não alegar resultados até esses testes ocorrerem.
- Foi criado pitch deck atualizado de 10 slides para o Crypto World’s Fair (`~/Downloads/IASX-Pitch-Hackathon.pptx`) e roteiro oral/fontes/checklist (`~/Downloads/IASX-Pitch-Roteiro-e-Fontes.md`); os artefatos ficam em Downloads, não são automaticamente parte do repositório.
- Pesquisa Colosseum V2 consultou CHRO+ (4º DePIN/Renaissance), Echo (2º Undefined/Cypherpunk) e Humanship ID (5º Undefined/Cypherpunk), além de FAQ oficial do evento e arquivo “Confidential Auditing”. Cada precedente tem limitações registradas; prêmios não foram tratados como tração.
- `/me` indicou IASX Clinical Review inscrito no Crypto World’s Fair, status `draft`, sem track escolhida e sem teammates listados naquele registro. Confirmar/atualizar no portal antes do prazo.
- A campanha indica submissões até 12 out 2026; FAQ retorna 13 out 2026 06:59 UTC (mesmo limite em fuso das Américas na noite de 12 out). Confirmar no formulário e regras oficiais.
- O pitch destaca dever de declarar trabalho anterior ao hackathon; os commits conhecidos são 30 set e 3 out de 2026, mas podem existir artefatos anteriores. Não reivindicar que todo o produto foi criado durante o evento.

### 14.5 RISA — Escuta Clínica (integração demonstrativa no painel médico)

- Decisão de produto confirmada: RISA pertence à plataforma do médico, dentro da revisão do caso; não pertence ao link público que o paciente usa para enviar PDF. A página `/patient-upload/[caseId]` não foi editada para esta funcionalidade.
- Entrada: nova aba `RISA — Escuta Clínica` em `/cases/[id]/review` e atalho no `/dashboard/clinical`. O atalho de caso da sessão de validação foi alcançado pelo fluxo existente Dashboard -> Carregar caso demo -> Abrir revisão.
- Implementação atual: `components/RisaClinicalListening.tsx` e `lib/risaDemo.ts`; integração em `app/cases/[id]/review/page.tsx`, atalho em `app/dashboard/clinical/page.tsx` e navegação responsiva em `components/AppShell.tsx`.
- O modo atual é explicitamente sintético: solicita confirmação antes de iniciar, exibe indicador SIMULAÇÃO ATIVA, timer, pausar/retomar/encerrar, falas fixas com speaker/timestamp, origem da conversa demo e resumo editável/confirmável ou descartável. Correspondências com documentos do caso usam apenas trechos que já existem e são rotuladas como correspondência textual que exige avaliação profissional.
- Não há acesso ao microfone, captura, gravação, Speech-to-Text, chamada LLM, áudio real, armazenamento nem mudança automática no caso. A UI declara esses limites; nenhuma inferência foi simulada como se fosse output real. Rules engine crítico, consentimento real específico à gravação, retention policy configurável, providers backend e AWS continuam por implementar antes de qualquer modo de áudio real.
- Validação em 6 out 2026: `npm run build` passou; revisão clínica testada com caso demo; ativação exige checkbox, pause/end funcionam, resumo aparece e pode ser descartado; no viewport 390 px a página tem `scrollWidth=390`; rotas paciente e revisão retornam HTTP 200, e o HTML inicial do upload de paciente não inclui a RISA.

### 14.4 Arquivos de apresentação

- PowerPoint atualizado de 10 slides: `~/Downloads/IASX-Pitch-Hackathon.pptx`.
- Roteiro oral, links/citações e checklist de submissão: `~/Downloads/IASX-Pitch-Roteiro-e-Fontes.md`.
- O roteiro assinala o estado de submissão `draft`, track ainda não selecionada, obrigação de declarar trabalho anterior e a necessidade de confirmar hora/formato diretamente nas regras e no portal.
