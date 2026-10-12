"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Language = "pt" | "en";

const LANGUAGE_KEY = "risa-interface-language";
const translations: Record<string, string> = {
  "Portal médico": "Medical portal",
  "Revisão estruturada com IA": "Structured AI-assisted review",
  "Evidências rastreáveis": "Traceable evidence",
  "Integridade e attestation": "Integrity and attestation",
  "Inteligência, integridade e confiança na revisão de documentos clínicos.": "Intelligence, integrity, and trust in clinical document review.",
  "Ambiente de demonstração — use somente dados sintéticos. A ferramenta não realiza diagnóstico, prescrição ou recomendação médica.": "Demonstration environment — use synthetic data only. This tool does not provide diagnoses, prescriptions, or medical recommendations.",
  "Painel médico": "Medical dashboard",
  "Meus casos": "My cases",
  "Resumo documental": "Document summary",
  "Wiki RISA": "RISA Wiki",
  "Segurança": "Security",
  "Configurações": "Settings",
  "Dra. Laura Santos": "Dr. Laura Santos",
  "Notificações": "Notifications",
  "Buscar casos, documentos ou achados...": "Search cases, documents, or findings...",
  "Não realiza diagnóstico, prescrição ou recomendação médica. Dados fictícios.": "This tool does not provide diagnoses, prescriptions, or medical recommendations. Demonstration data only.",
  "A RISA Verify organiza, cruza e sinaliza informações contidas em documentos enviados pelo usuário. A ferramenta não realiza diagnóstico, prescrição ou recomendação médica, e não substitui o julgamento de um profissional de saúde habilitado. Todos os dados exibidos nesta demonstração são fictícios.": "RISA Verify organizes, compares, and flags information in user-submitted documents. It does not diagnose, prescribe, or recommend medical treatment, and does not replace the judgment of a qualified healthcare professional. All data shown in this demonstration is fictional.",
  "Acesse sua conta": "Sign in",
  "Entre com as credenciais do portal médico.": "Enter your medical portal credentials.",
  "Usuário": "Username",
  "Senha": "Password",
  "Mostrar senha": "Show password",
  "Ocultar senha": "Hide password",
  "Entrar": "Sign in",
  "Entrando...": "Signing in...",
  "Usuário ou senha incorretos.": "Incorrect username or password.",
  "Não foi possível autenticar.": "Unable to sign in.",
  "Novo caso": "New case",
  "Carregar caso de demonstração": "Load demo case",
  "Analisar caso": "Analyze case",
  "Analisando o caso...": "Analyzing case...",
  "Painel de gestão": "Overview",
  "Casos, revisões e estatísticas populacionais": "Cases, reviews, and population statistics",
  "Resumo executivo": "Executive summary",
  "Linha do tempo": "Timeline",
  "Eventos": "Events",
  "Casos": "Cases",
  "Achados": "Findings",
  "Atestados": "Attestations",
  "Pendentes": "Pending",
  "Documentos": "Documents",
  "Conflitos": "Conflicts",
  "Revisões": "Reviews",
  "Hoje": "Today",
  "Fluxo de revisão": "Review workflow",
  "Revisão": "Review",
  "Confiança": "Confidence",
  "Docs.": "Docs",
  "Atualização": "Updated",
  "Status": "Status",
  "pendentes": "pending",
  "em análise": "under analysis",
  "Requerem atenção": "Require attention",
  "Comparação cruzada": "Cross-source comparison",
  "Informação incompleta": "Incomplete information",
  "Envio de documentos": "Document upload",
  "Análise assistida": "Assisted analysis",
  "Revisão médica": "Medical review",
  "Conclusão": "Completion",
  "Concluído": "Completed",
  "Pendente": "Pending",
  "Caso não encontrado.": "Case not found.",
  "Nenhum caso disponível. Carregue o caso de demonstração ou crie um novo caso.": "No cases available. Load the demo case or create a new case.",
  "Lista de casos, documentos e etapas da revisão.": "Cases, documents, and review stages.",
  "Buscar caso ou referência": "Search by case or reference",
  "Todos os estágios": "All stages",
  "Rascunho": "Draft",
  "Aguardando documentos": "Awaiting documents",
  "Aguardando upload": "Awaiting upload",
  "Em análise": "Under analysis",
  "Revisão pendente": "Review pending",
  "Revisão concluída": "Review complete",
  "Nenhum caso corresponde à busca e aos filtros.": "No cases match your search and filters.",
  "Crie um novo caso ou ajuste os filtros acima.": "Create a new case or adjust the filters above.",
  "PDFs recebidos de pacientes": "PDFs received from patients",
  "Arquivos armazenados após o envio pelo paciente.": "Files stored after patient upload.",
  "Atualizar": "Refresh",
  "Ambiente de demonstração. Use apenas PDFs sintéticos; não envie documentos clínicos nem dados pessoais reais.": "Demonstration environment. Use synthetic PDFs only; do not upload real clinical documents or personal data.",
  "Nenhum PDF recebido ainda. Novos envios aparecem aqui automaticamente.": "No PDFs received yet. New uploads appear here automatically.",
  "Abrir caso": "Open case",
  "Abrir revisão": "Open review",
  "Caso selecionado": "Selected case",
  "Caso": "Case",
  "Caso ": "Case ",
  " documentos": " documents",
  " achados": " findings",
  " conflitos": " conflicts",
  " revisões": " reviews",
  "Quadro de evidências e risco": "Evidence and risk overview",
  "Resumo documentado para suporte à revisão profissional.": "Documented summary to support professional review.",
  "Resumo final para revisão humana": "Final summary for human review",
  "Resultado documentado": "Documented result",
  "Achados e evidências": "Findings and evidence",
  "Conflitos e lacunas": "Conflicts and gaps",
  "Resumo documental — sem substituição da decisão profissional": "Document summary; does not replace professional judgment",
  "Este resumo organiza achados, evidências, conflitos e lacunas. Ele não conclui o caso, não diagnostica, não prescreve e não substitui o julgamento clínico do profissional.": "This summary organizes findings, evidence, conflicts, and gaps. It does not conclude the case, diagnose, prescribe, or replace the professional's clinical judgment.",
  "Evidências": "Evidence",
  "Visão geral": "Overview",
  "Revisão estruturada": "Structured review",
  "RISA — Escuta Clínica": "RISA — Clinical Listening",
  "Revisar achados →": "Review findings →",
  "Este caso ainda não possui análise concluída.": "Analysis for this case is not complete yet.",
  "Executar análise": "Run analysis",
  "Análise concluída": "Analysis complete",
  "Sem dados suficientes para exibir uma tendência.": "Not enough data to show a trend.",
  "Não há eventos suficientes para exibir a linha do tempo.": "Not enough events to show a timeline.",
  "Nenhum achado identificado.": "No findings identified.",
  "Nenhum conflito identificado entre as fontes.": "No conflicts identified between sources.",
  "Nenhuma lacuna relevante identificada.": "No relevant gaps identified.",
  "Fontes divergentes para revisão": "Conflicting sources for review",
  "Revisar conflito": "Review conflict",
  "Evidências e fontes": "Evidence and sources",
  "Ver detalhes da evidência": "View evidence details",
  "Detalhe da evidência": "Evidence details",
  "Documento de origem": "Source document",
  "Tipo do achado": "Finding type",
  "Enviar para revisão": "Send for review",
  "Fechar": "Close",
  "Prioridade do fluxo": "Workflow priority",
  "Clareza do registro": "Record clarity",
  "Revisão humana necessária": "Human review required",
  "Revisão humana opcional": "Human review optional",
  "Julgamento e Encaminhamento (JEV)": "Judgment and Referral (JEV)",
  "Decisão do profissional": "Professional decision",
  "Confirmação, correção ou rejeição dos achados": "Confirm, correct, or reject findings",
  "Revisão humana": "Human review",
  "Revisão profissional": "Professional review",
  "Item anterior": "Previous item",
  "Próximo item": "Next item",
  "Revisado": "Reviewed",
  "Pendente de revisão": "Review pending",
  "Evidência principal": "Primary evidence",
  "Fontes em comparação": "Sources compared",
  "Confirmar informação": "Confirm information",
  "Corrigir informação": "Correct information",
  "Rejeitar achado": "Reject finding",
  "Valor corrigido": "Corrected value",
  "Informe o valor revisado": "Enter the reviewed value",
  "Justificativa": "Rationale",
  "Salvar": "Save",
  "Cancelar": "Cancel",
  "Concluir revisão": "Complete review",
  "Conclusão da revisão": "Review completion",
  "Revisão profissional registrada": "Professional review recorded",
  "Registro da revisão calculado neste navegador": "Review record calculated in this browser",
  "Nenhuma transação Solana foi enviada": "No Solana transaction was sent",
  "Conexão ativa · modo demonstração": "Connection active · demo mode",
  "Demonstração do gateway SAS no fluxo RISA": "SAS gateway demo in the RISA workflow",
  "A revisão local calcula um hash de integridade e mantém o registro de evidência vinculado ao caso. Neste modo de demonstração, o fluxo mostra como o mesmo contexto será assinado e publicado no provedor SAS; nenhuma transação real é enviada.": "The local review computes an integrity hash and keeps the evidence record linked to the case. In this demo mode, the flow shows how the same context will be signed and published to the SAS provider; no real transaction is sent.",
  "Estado on-chain": "On-chain status",
  "Conectado": "Connected",
  "modo demonstração": "demo mode",
  "Ver status do provedor": "View provider status",
  "A conexão com Solana é simulada para demonstrar o fluxo previsto do MVP. Nenhuma assinatura, atestação SAS ou transação foi criada; o hash permanece local. PDFs e dados clínicos não são enviados à blockchain.": "The Solana connection is simulated to demonstrate the MVP's planned workflow. No signature, SAS attestation, or transaction was created; the hash remains local. PDFs and clinical data are not sent to the blockchain.",
  "Integridade e rastreabilidade": "Integrity and traceability",
  "Atestação local": "Local attestation",
  "Prévia local · demo": "Local preview · demo",
  "Hash local (demo)": "Local hash (demo)",
  "Calculando…": "Calculating…",
  "Hash calculado localmente": "Hash calculated locally",
  "Registrada localmente": "Recorded locally",
  "Próxima etapa: revisão e assinatura SAS": "Next step: SAS review and signing",
  "Prévia pronta · demo": "Preview ready · demo",
  "Não publicada": "Not published",
  "Hash de prévia calculado a partir deste caso para demonstração. A atestação só será registrada após revisão; publicação SAS exige signer e transação explícita.": "Preview hash calculated from this case for demonstration. The attestation will only be recorded after review; SAS publication requires a signer and an explicit transaction.",
  "Atestação registrada localmente. Nenhuma assinatura ou transação Solana foi enviada.": "Attestation recorded locally. No Solana signature or transaction was sent.",
  "Hash do resultado": "Result hash",
  "Registrado em": "Recorded on",
  "Hash local": "Local hash",
  "Integração planejada": "Integration planned",
  "O registro atual é local. Nenhuma transação foi enviada à Solana.": "The current record is local. No transaction has been sent to Solana.",
  "A análise foi revisada e confirmada com sucesso.": "The analysis has been reviewed and confirmed successfully.",
  "Este hash foi calculado neste navegador a partir do registro da revisão. Ele não foi publicado nem confirmado na Solana; a revisão e os documentos permanecem neste navegador.": "This hash was calculated in this browser from the review record. It has not been published or confirmed on Solana; the review and documents remain in this browser.",
  "Verificar integridade": "Verify integrity",
  "Voltar ao painel médico": "Back to medical dashboard",
  "Configurações da clínica": "Clinic settings",
  "Personalização": "Personalization",
  "Restaurar padrão": "Restore defaults",
  "Exibir aba RISA": "Show RISA tab",
  "Mostra a seção de escuta clínica na revisão do caso.": "Show the clinical listening section in case review.",
  "Ativar áudio da RISA": "Enable RISA audio",
  "Permite iniciar a escuta por microfone ou reprodução sintética.": "Allows listening via microphone or synthetic audio.",
  "Exibe o bloco de resumo clínico em telas de apoio ao médico.": "Show the clinical summary on physician support screens.",
  "Indicadores de risco": "Risk indicators",
  "Mostra indicadores de risco e triagem na visão do profissional.": "Show risk and triage indicators in the professional view.",
  "Exibe a sequência de eventos durante a revisão do caso.": "Show the sequence of events during case review.",
  "Link do paciente": "Patient link",
  "Compartilhamento do upload": "Upload sharing",
  "Copiar link": "Copy link",
  "Copiado": "Copied",
  "Use este link para o paciente enviar o documento em segurança dentro do fluxo do RISA Verify.": "Use this link for the patient to securely submit a document through RISA Verify.",
  "Preferências salvas neste navegador.": "Preferences saved in this browser.",
  "As alterações são aplicadas a este perfil médico.": "Changes apply to this physician profile.",
  "Segurança e arquitetura": "Security and architecture",
  "Padrões para armazenamento, criptografia e auditoria": "Standards for storage, encryption, and auditing",
  "Modelo de confiança": "Trust model",
  "Armazenamento": "Storage",
  "Chaves": "Keys",
  "Integridade": "Integrity",
  "Acesso": "Access",
  "Dados": "Data",
  "Auditoria": "Auditing",
  "Fluxo de produção recomendado": "Recommended production workflow",
  "Análise": "Analysis",
  "Atestação": "Attestation",
  "Estatísticas populacionais": "Population statistics",
  "Contagem de pessoas por diagnóstico, com filtros de data, idade e sexo.": "Count of people by diagnosis, with filters for date, age, and sex.",
  "Filtros": "Filters",
  "Limpar filtros": "Clear filters",
  "Contagem por diagnóstico": "Count by diagnosis",
  "Nenhum registro corresponde aos filtros selecionados.": "No records match the selected filters.",
  "Pessoas": "People",
  "Período": "Period",
  "Abrir PDF": "Open PDF",
  "Hash do registro local": "Local record hash",
  "Hash da análise": "Analysis hash",
  "Hash das decisões": "Decision hash",
  "Decisões profissionais": "Professional decisions",
  "Versão do registro": "Record version",
  "Revisor": "Reviewer",
  "Criado em": "Created on",
  "Escopo dos documentos": "Document scope",
  "PDF original": "Original PDF",
  "Texto extraído e metadados": "Extracted text and metadata",
  "Salvar comprovante (PDF)": "Save receipt (PDF)",
  "Página": "Page",
  "Conflito": "Conflict",
  "Lacuna": "Gap",
  "Alta": "High",
  "Média": "Medium",
  "Baixa": "Low",
  "Fonte A": "Source A",
  "Fonte B": "Source B",
  "Todos": "All",
  "Todos os diagnósticos": "All diagnoses",
  "Diagnóstico": "Diagnosis",
  "Idade mínima": "Minimum age",
  "Idade máxima": "Maximum age",
  "Ano": "Year",
  "Mês": "Month",
  "Dia": "Day",
  "Sexo": "Sex",
  "Feminino": "Female",
  "Masculino": "Male",
  "Não informado": "Not specified",
  "Arquitetura da inteligência artificial": "AI architecture",
  "Segurança e privacidade": "Security and privacy",
  "Operação e governança": "Operations and governance",
  "Extração de texto": "Text extraction",
  "Comparação documental": "Document comparison",
  "Detecção de conflitos": "Conflict detection",
  "Geração de resumo": "Summary generation",
  "Dados minimizados": "Data minimization",
  "Criptografia no armazenamento": "Encryption at rest",
  "Controle de acesso": "Access control",
  "Registro de auditoria": "Audit log",
  "Limite de tamanho dos arquivos": "File size limit",
  "Variáveis de ambiente": "Environment variables",
  "Logs estruturados": "Structured logs",
  "Modelos reconfiguráveis": "Configurable models",
  "Avaliação de riscos": "Risk assessment",
  "Princípio central": "Core principle",
  "O sistema ainda não identificou achados nesta revisão. A análise continua em andamento.": "The system has not identified findings in this review yet. Analysis is still in progress.",
  "Valor clínico": "Clinical value",
  "Abrir resumo final": "Open final summary",
  "Fontes rastreáveis": "Traceable sources",
  "Cada item está vinculado a um documento e uma página.": "Each item is linked to a document and page.",
  "Conflitos de alta severidade": "High-severity conflicts",
  "Exigem comparação cuidadosa entre fontes.": "Require careful comparison across sources.",
  "Achados de baixa confiança": "Low-confidence findings",
  "Requerem confirmação por documentação adicional.": "Require confirmation from additional documentation.",
  "Sem data": "No date",
  "Em andamento": "In progress",
  "Revisar todos os itens e preencher os valores corrigidos antes de concluir.": "Review all items and enter corrected values before completing.",
  "Selecione uma ação para este item antes de continuar.": "Select an action for this item before continuing.",
  "Informe o valor corrigido antes de continuar.": "Enter the corrected value before continuing.",
  "Nenhum achado ou conflito para revisar neste caso.": "There are no findings or conflicts to review in this case.",
  "O conjunto analisado contém": "The analyzed set contains",
};

const englishToPortuguese = new Map(Object.entries(translations).map(([portuguese, english]) => [english, portuguese]));
const portugueseToEnglish = new Map(Object.entries(translations));

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({
  language: "pt",
  setLanguage: () => undefined,
});

function translatedText(value: string, language: Language) {
  const trimmed = value.trim();
  const dictionary = language === "en" ? portugueseToEnglish : englishToPortuguese;
  const exact = dictionary.get(trimmed);
  if (exact) return value.replace(trimmed, exact);

  if (language === "en") {
    const countLabel = trimmed.match(/^(\d+)\s+(documentos|achados|conflitos|revisões)$/i);
    if (countLabel) {
      const noun = countLabel[2].toLowerCase();
      const translatedNoun: Record<string, string> = {
        documentos: "documents",
        achados: "findings",
        conflitos: "conflicts",
        revisões: "reviews",
      };
      return `${countLabel[1]} ${translatedNoun[noun]}`;
    }
  }

  return value;
}

function translateSubtree(root: Node, language: Language) {
  if (root.nodeType === Node.TEXT_NODE) {
    const currentText = root.nodeValue ?? "";
    const translated = translatedText(currentText, language);
    if (translated !== currentText) root.nodeValue = translated;
    return;
  }

  const ownerDocument = root.ownerDocument ?? (root as Document);
  const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue?.trim()) continue;
    const translated = translatedText(node.nodeValue, language);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }

  const elements = root instanceof HTMLElement ? [root, ...Array.from(root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]"))] : [];
  for (const element of elements) {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const translated = translatedText(value, language);
      if (translated !== value) element.setAttribute(attribute, translated);
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    if (storedLanguage === "en" || storedLanguage === "pt") setLanguageState(storedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "pt-BR";
    translateSubtree(document.body, language);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target instanceof Text) {
          const translated = translatedText(record.target.nodeValue ?? "", language);
          if (translated !== record.target.nodeValue) record.target.nodeValue = translated;
        }
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) translateSubtree(node, language);
        });
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  function setLanguage(nextLanguage: Language) {
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
  }

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
