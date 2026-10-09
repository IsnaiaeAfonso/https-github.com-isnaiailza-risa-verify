# Briefing de comunicação — RISA Verify

**Objetivo:** dar à pessoa responsável por redes sociais informações verificadas para criar um pitch, publicações e uma demonstração coerentes com o protótipo atual.

**Versão do produto descrita neste documento:** protótipo demonstrativo disponível em 8 de outubro de 2026. Atualize este briefing sempre que a implementação mudar. O nome a usar é **RISA Verify**; a assistente é **RISA**.

## Em uma frase

RISA Verify ajuda profissionais de saúde a organizar documentos clínicos, destacar possíveis achados, conflitos e lacunas e conduzir uma revisão humana com referências às fontes. O paciente pode enviar um PDF por um link de upload associado a um médico.

## Pitch curto sugerido

> Clínicas recebem documentos em formatos e momentos diferentes, e localizar a informação de origem pode tornar a revisão trabalhosa. O RISA Verify organiza documentos, evidencia possíveis achados e divergências e mantém o profissional no centro da decisão. O paciente envia o PDF por um link próprio; no portal médico, os arquivos recebidos ficam identificados pelo profissional escolhido e disponíveis para consulta. A proposta é tornar a revisão documental mais rastreável, sem diagnosticar, prescrever ou substituir o julgamento clínico.

Este texto é um ponto de partida. Ajuste à voz da marca e ao público da publicação; não o apresente como evidência de resultados clínicos ou comerciais já comprovados.

## O que o protótipo demonstra

- **Portal médico:** painel, lista local de casos, resumo documental, revisão profissional, configurações e área de PDFs recebidos.
- **Assistente RISA:** experiência demonstrativa de escuta clínica dentro da plataforma médica; não aparece no formulário público do paciente.
- **Upload do paciente:** formulário público separado do portal, com consentimento, seleção de médico e envio de PDF.
- **Validação do arquivo:** limite de 25 MB e verificação da assinatura inicial `%PDF-` no servidor.
- **Registro do envio:** SHA-256, médico selecionado, horário, consentimento e referência do caso são registrados na fila do protótipo.
- **Armazenamento:** sem bucket S3 configurado, o PDF fica em disco local no computador que executa o servidor. O código oferece opção de S3 com criptografia do lado do servidor; essa opção precisa ser configurada e validada no ambiente de hospedagem antes de ser anunciada como operacional.
- **Visão médica dos uploads:** PDFs recém-recebidos aparecem na seção “PDFs recebidos de pacientes” de “Meus casos”, com nome, médico, horário e hash. O profissional pode abrir o arquivo. A lista atualiza automaticamente.
- **Idiomas:** o portal tem seletor local de interface em português e inglês; conteúdo clínico, nomes e dados dos documentos não são traduzidos.
- **Acesso médico:** o protótipo usa uma senha compartilhada de demonstração e sessão temporária. Não há contas individuais, papéis de equipe nem autenticação institucional.

## Fluxo para demonstrar

1. Abrir o link público de upload e mostrar a identificação do caso fictício e o aviso de demonstração.
2. Mostrar o aceite e a lista de médicos disponíveis.
3. Selecionar um médico e anexar somente um PDF sintético.
4. Enviar o arquivo e confirmar o estado armazenado e o hash.
5. Entrar no portal médico e abrir “Meus casos”.
6. Na seção “PDFs recebidos de pacientes”, mostrar o arquivo ligado ao médico escolhido e abrir o PDF.
7. Explicar que esse recebimento é uma fila separada: o documento **não é incorporado automaticamente** à análise ou ao registro local de casos.
8. Se apresentar a verificação, esclarecer que o hash/snapshot atual é local e que nenhuma transação Solana foi enviada.

## Solana e Solana Attestation Service

**Estado atual:** a integração oficial com Solana Attestation Service (SAS) ainda não está implementada. O protótipo calcula hashes e mantém um registro/snapshot local no navegador. Não publica documentos nem hashes na Solana e não fornece uma prova on-chain verificável. A página de atestação declara que nenhuma transação Solana foi enviada.

**Como falar disso:** a Solana/SAS é uma direção planejada para uma futura camada de atestação de uma revisão concluída, não uma capacidade disponível nesta versão. Uma eventual implementação deve publicar somente um compromisso criptográfico minimizado, nunca PDF, nome, CPF, identificador clínico ou outro dado identificável. O conteúdo médico continuaria fora da blockchain; a rede não valida a qualidade clínica da revisão.

**Formulação segura:** “Estamos explorando uma futura integração com o Solana Attestation Service para atestar versões de revisões sem publicar documentos clínicos na blockchain.”

**Não dizer:** “verificado na Solana”, “atestado on-chain”, “SAS integrado”, “imutável na blockchain” ou “a Solana valida o conteúdo médico”.

## Privacidade e limites importantes

- Usar apenas casos e PDFs sintéticos nas demonstrações e publicações.
- O protótipo não foi validado para atendimento clínico real nem para armazenar dados reais de pacientes.
- Não afirmar conformidade com LGPD, HIPAA, normas regulatórias ou segurança clínica sem avaliação formal e evidências específicas.
- O login atual é uma credencial compartilhada de demonstração; não equivale a contas individuais ou controle de acesso institucional.
- O estado de casos e revisões fica principalmente no `localStorage` do navegador e não é compartilhado entre médicos ou dispositivos.
- A fila de upload e os consentimentos usam arquivos JSON locais neste modo. O PDF permanece no disco do servidor local; se o computador ou processo parar, o portal e o acesso ao arquivo podem ficar indisponíveis.
- Uploads são destinados ao médico selecionado, mas a listagem é uma área de demonstração da equipe; não descreva isso como isolamento multi-inquilino ou autorização por clínica.
- Um Quick Tunnel público é temporário, tem hostname variável e depende do computador e do processo do túnel. Não use como endereço permanente de campanha.
- O serviço organiza informações e apoia a revisão. Não diagnostica, prescreve, recomenda tratamento ou substitui profissional habilitado.

## Alegações que precisam de prova antes de publicar

Não afirmar que o produto:

- reduz erros, tempo ou custos em uma porcentagem determinada;
- melhora desfechos, tem precisão clínica validada ou foi aprovado por hospitais;
- já integra uploads automaticamente ao caso clínico;
- mantém operação contínua, armazenamento permanente ou acesso multiusuário;
- usa IA diagnóstica ou toma decisões clínicas;
- executa transações Solana/SAS nesta versão.

Para divulgar métricas, validação ou parcerias, primeiro documente a fonte, metodologia, período, autorização de uso do nome e contexto da medição.

## Texto curto para redes sociais

> Conheça o RISA Verify: um protótipo para organizar documentos clínicos e apoiar a revisão profissional com referências às fontes. O paciente pode enviar um PDF pelo link de upload; o médico consulta os arquivos recebidos no portal. Demonstração com dados sintéticos — não realiza diagnóstico nem substitui a avaliação profissional.

## Sugestões de conteúdo

- **Demonstração do fluxo:** link do paciente → seleção do profissional → PDF sintético → arquivo visível no portal médico.
- **Princípio de produto:** documentos e decisões clínicas ficam fora da blockchain; eventual atestação futura deve minimizar dados.
- **Transparência técnica:** mostrar claramente o que o protótipo faz agora e o que está planejado, especialmente em relação a SAS.
- **Revisão humana:** destacar que achados e divergências são pontos para conferência, não conclusões clínicas.

## Links e estado de publicação

- **Repositório configurado no Git:** https://github.com/silvanoarnates/iasx-clinical-review — confirmar que está público e que corresponde exatamente ao código que será divulgado.
- **Demonstração pública:** o Quick Tunnel muda e expira. Obtenha o hostname atual e teste upload e acesso médico imediatamente antes de publicar; não reutilize um endereço antigo.
- **Link do paciente:** usar a rota `/patient-upload/CV-DEMO-00123` no hostname verificado.
- **Portal médico:** usar a rota `/login`; nunca incluir senha em post, URL, captura de tela ou mensagem pública.
- **Credencial temporária compartilhada anteriormente:** deve ser trocada antes de qualquer divulgação mais ampla ou hospedagem pública.

## Checklist antes de publicar

- [ ] Confirmar que o hostname abre em uma janela privada e que os recursos da interface carregam.
- [ ] Testar login do médico, lista de uploads e abertura do PDF sintético.
- [ ] Enviar um PDF de demonstração e confirmar que aparece para o profissional escolhido.
- [ ] Verificar se o link do túnel ainda é atual; não publicar links Quick Tunnel antigos.
- [ ] Remover senhas, tokens, CPF, nomes reais e documentos reais de imagens ou vídeos.
- [ ] Dizer explicitamente que é um protótipo demonstrativo, com dados sintéticos e sem integração Solana/SAS ativa.
- [ ] Confirmar direitos de uso de marcas, imagens, alegações, depoimentos e nomes de instituições.
