export const RISA_CONFIG = {
  speechLanguage: "pt-BR",
  maximumTranscriptUtterances: 300,
  audioRetentionPolicy: process.env.NEXT_PUBLIC_RISA_AUDIO_RETENTION_POLICY?.trim() || "O IASX não cria nem armazena arquivos de áudio nesta versão.",
  transcriptRetentionPolicy: process.env.NEXT_PUBLIC_RISA_TRANSCRIPT_RETENTION_POLICY?.trim() || "Transcrição mantida apenas em memória até descartar a sessão ou fechar/recarregar a página.",
  browserProviderNotice: "O reconhecimento de fala é fornecido pelo navegador e pode processar áudio fora do IASX; consulte as políticas do navegador/fornecedor.",
  externalReferencesEnabled: false,
  criticalRulesEngineEnabled: false,
} as const;
