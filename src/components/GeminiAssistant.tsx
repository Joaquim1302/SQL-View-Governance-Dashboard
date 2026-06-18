import { useState } from "react";
import type { SQLViewEntry } from "../types";
import { Sparkles, Brain, Code, FolderGit, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface GeminiAssistantProps {
  currentSQL: string;
  currentName: string;
  currentDatabase: string;
  onApplySQL: (name: string, sql: string, purpose: string, database: string) => void;
}

export default function GeminiAssistant({
  currentSQL,
  currentName,
  currentDatabase,
  onApplySQL
}: GeminiAssistantProps) {
  // Mode Select: "validate" | "generate"
  const [activeTab, setActiveTab] = useState<"validate" | "generate">("validate");

  // Validate state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generate state
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [dbPrefer, setDbPrefer] = useState("nexus");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Trigger Validation of active SQL/Name
  const handleValidate = async () => {
    if (!currentName || !currentSQL) {
      setValidationError("Nenhuma view ativa ou código SQL encontrado para validar.");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      const response = await fetch("/api/gemini/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewName: currentName,
          sqlContent: currentSQL,
          database: currentDatabase
        })
      });

      if (!response.ok) {
        throw new Error("Erro na comunicação com o servidor.");
      }

      const data = await response.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationError(err.message || "Falha ao validar código.");
    } finally {
      setIsValidating(false);
    }
  };

  // Trigger Generate View
  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      setGenerateError("Digite um escopo ou descrição para que a I.A. possa gerar o código.");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedResult(null);

    try {
      const response = await fetch("/api/gemini/generate-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: generatePrompt,
          dbContext: dbPrefer
        })
      });

      if (!response.ok) {
        throw new Error("Erro de comunicação com rede ou chave de API ausente.");
      }

      const data = await response.json();
      setGeneratedResult(data);
    } catch (err: any) {
      setGenerateError(err.message || "Erro de geração.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyGenerated = () => {
    if (generatedResult) {
      onApplySQL(
        generatedResult.viewName,
        generatedResult.sqlCode,
        generatedResult.purpose,
        generatedResult.database
      );
      // Switch tabs back to validate or show success
      setActiveTab("validate");
      setGeneratedResult(null);
      setGeneratePrompt("");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg space-y-5" id="gemini-assistant">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div id="ai-assistant-heading" className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg text-white shadow-md">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base">Linter de IA & Assistente Nexus</h3>
            <p className="text-xs text-slate-400">Verifique convenções e otimize queries em tempo real</p>
          </div>
        </div>
        <span className="bg-indigo-950/50 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-900/30">
          Gemini 3.5 Flash
        </span>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
        <button
          id="btn-ai-tab-validate"
          onClick={() => setActiveTab("validate")}
          className={`flex-1 text-center py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === "validate"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Analisar e Otimizar View
        </button>
        <button
          id="btn-ai-tab-generate"
          onClick={() => setActiveTab("generate")}
          className={`flex-1 text-center py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === "generate"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Gerar View via I.A.
        </button>
      </div>

      {/* Mode 1: Validate View */}
      {activeTab === "validate" && (
        <div className="space-y-4" id="ai-tab-validate-content">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">View ativa selecionada:</span>
            <div className="flex items-center space-x-2">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-indigo-300">{currentName || "Nenhuma selecionada (use no painel)"}</span>
              <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-1.5 rounded">{currentDatabase}</span>
            </div>
          </div>

          <button
            id="btn-trigger-ai-validate"
            disabled={isValidating || !currentName}
            onClick={handleValidate}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-950/50"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando estrutura SQL e Suffixos...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Auditar SQL com Gemini</span>
              </>
            )}
          </button>

          {validationError && (
            <div className="p-3 bg-rose-950/30 border border-rose-900 rounded-lg text-rose-400 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {validationResult && (
            <div className="space-y-4 animate-fadeIn text-xs" id="ai-validation-results">
              {/* Header result */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Nomenclatura Git-First</span>
                  <div className="flex items-center space-x-2">
                    {validationResult.prefixValid ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className={`font-semibold ${validationResult.prefixValid ? "text-emerald-400" : "text-amber-500"}`}>
                      {validationResult.prefixValid ? "Dentro do Padrão" : "Violação de Suffixos"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                    {validationResult.namingFeedback}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Classificação Detectada</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-indigo-300 font-mono">
                      {validationResult.prefixType === "cs" && "cs_ (Staging / Estruturada)"}
                      {validationResult.prefixType === "vw" && "vw_ (Analítica / Relatório)"}
                      {validationResult.prefixType === "invalid" && "Inválida / Não segue padrão"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    O aplicativo desktop usará regex para recusar criações inválidas.
                  </p>
                </div>
              </div>

              {/* Criticism */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <h4 className="font-semibold text-slate-200">Parecer de Banco de Dados:</h4>
                <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans">
                  {validationResult.criticism || "A query SQL está bem formulada e otimizada."}
                </p>
              </div>

              {/* Suggestions */}
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                  <h4 className="font-semibold text-slate-200">Recomendações e Otimizações:</h4>
                  <ul className="space-y-1 text-[11px] text-slate-300 pl-1">
                    {validationResult.suggestions.map((sug: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimized SQL with Apply block */}
              {validationResult.optimizedSql && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">SQL Otimizado Recomendado pela IA:</span>
                    <button
                      id="btn-apply-ai-optimized-sql"
                      onClick={() => onApplySQL(currentName, validationResult.optimizedSql, "Otimizado automaticamente pela I.A.", currentDatabase)}
                      className="bg-indigo-900/40 border border-indigo-700/50 hover:bg-indigo-800/50 text-indigo-300 text-[11px] px-2.5 py-1 rounded transition-colors"
                    >
                      Substituir pelo Otimizado
                    </button>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[160px]">
                    <code>{validationResult.optimizedSql}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Generate View Boilerplate */}
      {activeTab === "generate" && (
        <div className="space-y-4" id="ai-tab-generate-content">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Explique o que você quer que a View filtre:</label>
            <textarea
              id="ai-generate-prompt-input"
              rows={3}
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              placeholder="Exemplo: Uma camada structed/staging que pegue produtos unindo categoria, em pt-BR e filtre apenas marcas ativas."
              className="w-full bg-slate-950 text-xs border border-slate-800 rounded-lg p-3 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans leading-normal resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">Banco de Dados Alvo</span>
              <select
                id="ai-target-database-select"
                value={dbPrefer}
                onChange={(e) => setDbPrefer(e.target.value)}
                className="w-full bg-slate-950 text-xs border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="nexus">nexus</option>
                <option value="nexus_sales">nexus_sales</option>
                <option value="magento">magento</option>
              </select>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center">
              <span className="text-[10px] text-slate-500 leading-relaxed font-sans">
                A I.A. auto-detectará o prefixo conforme regras: <code>cs_</code> para staging, <code>vw_</code> para relatórios.
              </span>
            </div>
          </div>

          <button
            id="btn-trigger-ai-generate"
            disabled={isGenerating || !generatePrompt.trim()}
            onClick={handleGenerate}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Criando View Segura na pasta Git...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar SQL e Registro de Manifesto</span>
              </>
            )}
          </button>

          {generateError && (
            <div className="p-3 bg-rose-950/30 border border-rose-900 rounded-lg text-rose-400 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{generateError}</span>
            </div>
          )}

          {generatedResult && (
            <div className="space-y-4 animate-fadeIn border-t border-slate-800 pt-3 text-xs" id="ai-generation-results">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-semibold text-indigo-400 font-mono text-xs">{generatedResult.viewName}</span>
                  <span className="text-[9px] bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-900/20">
                    Propósito Identificado: {generatedResult.database}
                  </span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <p className="font-medium text-[11px]"><span className="text-slate-400 font-normal">Objetivo:</span> {generatedResult.purpose}</p>
                  <p className="font-serif italic text-slate-400 text-[10.5px] leading-relaxed">
                    "{generatedResult.reasoning}"
                  </p>
                </div>
              </div>

              {/* Generated SQL preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Estrutura SQL Proposta:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-mono">
                      <CheckCircle className="w-3 h-3" />
                      <span>✓ Nomenclatura válida</span>
                    </span>
                  </div>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[180px]">
                  <code>{generatedResult.sqlCode}</code>
                </pre>
              </div>

              <button
                id="btn-apply-generated-view-to-manifest"
                onClick={handleApplyGenerated}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-md"
              >
                <FolderGit className="w-4 h-4" />
                <span>Salvar no Git e Registrar no Manifesto</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
