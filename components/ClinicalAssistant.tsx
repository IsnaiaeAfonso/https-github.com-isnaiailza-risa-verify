"use client";

import { useState } from "react";
import {
  answerCaseQuestion,
  CaseAssistantQuestion,
  CaseAssistantResponse,
  CaseQuestionId,
  suggestedCaseQuestions,
} from "@/lib/clinicalAssistant";
import { ClinicalCase } from "@/lib/types";

interface SelectedQuestion {
  id: CaseQuestionId;
  response: CaseAssistantResponse;
}

export default function ClinicalAssistant({ clinicalCase }: { clinicalCase: ClinicalCase }) {
  const questions = suggestedCaseQuestions(clinicalCase);
  const [selected, setSelected] = useState<SelectedQuestion | null>(null);
  const selectedQuestion = questions.find((question) => question.id === selected?.id);

  function selectQuestion(questionId: CaseQuestionId) {
    setSelected({
      id: questionId,
      response: answerCaseQuestion(clinicalCase, questionId),
    });
  }

  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="clinical-assistant-title">
      <div className="mb-4">
        <h2 id="clinical-assistant-title" className="text-sm font-semibold text-ink">
          Perguntas sobre este caso
        </h2>
        <p className="text-xs text-muted mt-1">
          Consulte os achados, evidências e evolução identificados nesta análise.
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="text-xs text-muted mb-4" role="status">
          Após a análise, perguntas relevantes sobre o caso aparecerão aqui.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
            {questions.map((question: CaseAssistantQuestion) => (
              <button
                key={question.id}
                type="button"
                onClick={() => selectQuestion(question.id)}
                aria-pressed={selected?.id === question.id}
                className={`focus-ring rounded-md border px-3.5 py-3 text-left text-sm transition-colors ${
                  selected?.id === question.id
                    ? "border-brand bg-brand-light/40 text-brand-dark"
                    : "border-line bg-panel text-ink hover:border-brand/50 hover:bg-brand-light/20"
                }`}
              >
                {question.label}
              </button>
            ))}
          </div>

          {selected && selectedQuestion && (
            <div className="border-t border-line pt-4" aria-live="polite">
              <h3 className="text-sm font-semibold text-ink">{selectedQuestion.label}</h3>
              <p className="text-sm text-ink leading-relaxed mt-2">{selected.response.answer}</p>
              {selected.response.sources.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted mb-2">Fontes relacionadas</h4>
                  <ul className="space-y-2">
                    {selected.response.sources.map((source, index) => (
                      <li key={`${source.documentId ?? source.documentName}-${source.page ?? ""}-${index}`}>
                        <p className="text-xs text-ink">
                          {source.page !== undefined
                            ? `${source.documentName} — pág. ${source.page}`
                            : `Fonte disponível: ${source.documentName}`}
                        </p>
                        {source.excerpt && (
                          <p className="text-xs text-muted mt-1 leading-relaxed">
                            Trecho/campo disponível: “{source.excerpt}”
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}