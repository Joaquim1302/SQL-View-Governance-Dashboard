import { useState } from "react";
import type { DevelopmentGuideStep } from "../types";
import { DEVELOPMENT_GUIDE_STEPS } from "../data";
import { 
  Terminal, ShieldCheck, Cpu, Package, Settings, GitBranch, 
  Copy, Check, ChevronDown, ChevronUp, BookOpen, Layers
} from "lucide-react";

export default function GuideSection() {
  const [activeStep, setActiveStep] = useState<string>("step1");
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
    step7: false
  });
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStepIcon = (category: string) => {
    switch (category) {
      case "linguagem":
        return <Cpu className="w-5 h-5 text-indigo-500" />;
      case "ambiente":
        return <Settings className="w-5 h-5 text-emerald-500" />;
      case "interface":
        return <Layers className="w-5 h-5 text-sky-500" />;
      case "arquitetura":
        return <ShieldCheck className="w-5 h-5 text-amber-500" />;
      case "git":
        return <GitBranch className="w-5 h-5 text-purple-500" />;
      case "final":
        return <Package className="w-5 h-5 text-rose-500" />;
      default:
        return <Terminal className="w-5 h-5 text-slate-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const base = "text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ";
    switch (category) {
      case "linguagem":
        return base + "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300";
      case "ambiente":
        return base + "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300";
      case "interface":
        return base + "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300";
      case "arquitetura":
        return base + "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300";
      case "git":
        return base + "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300";
      case "final":
        return base + "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300";
      default:
        return base + "bg-slate-100 text-slate-800";
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => {
      setCopiedTextId(null);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="guide-section">
      {/* Sidebar step overview */}
      <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">Roteiro de Desenvolvimento</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          Escolhas arquiteturais propostas para empacotar o software de controle particular de SQL Views no Windows.
        </p>
        <div className="space-y-1">
          {DEVELOPMENT_GUIDE_STEPS.map((step) => {
            const isSelected = activeStep === step.id;
            return (
              <button
                key={step.id}
                id={`btn-guide-step-${step.id}`}
                onClick={() => {
                  setActiveStep(step.id);
                  // Make sure the clicked step is expanded in the view list
                  setExpandedSteps(prev => ({ ...prev, [step.id]: true }));
                  // Scroll step into view smoothly
                  const element = document.getElementById(`view-step-${step.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-150 flex items-center space-x-3 border ${
                  isSelected 
                    ? "bg-indigo-600 border-indigo-600 text-white font-medium shadow-md shadow-indigo-100 dark:shadow-none" 
                    : "bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span className={`p-1.5 rounded-md ${isSelected ? "bg-indigo-700 text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-500"}`}>
                  {getStepIcon(step.category)}
                </span>
                <span className="truncate flex-1 font-sans">{step.title}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <h4 className="font-medium text-slate-700 dark:text-slate-300">Resumo Tecnológico:</h4>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>Linguagem:</strong> Python 3.11</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>Janelas:</strong> CustomTkinter (Dark Mode nativo)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>Banco:</strong> PyMySQL (com SSL habilitado)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>Build final:</strong> PyInstaller para .exe portátil</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main step content list */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start space-x-3">
          <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-amber-800 dark:text-amber-400 font-semibold text-sm">A Regra de Ouro do Nexus One</h4>
            <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
              <strong>Nenhuma view deve ser criada diretamente no MySQL Workbench ou DBeaver!</strong> Todas as instruções de view SQL devem ser salvas fisicamente nas pastas locais rastreadas pelo Git e registradas sob o manifesto oficial <code>create_nexus_views_manifests.json</code>. O script de automação lê as views ativas e executa de forma limpa.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {DEVELOPMENT_GUIDE_STEPS.map((step) => {
            const isSelected = activeStep === step.id;
            const isExpanded = expandedSteps[step.id];
            return (
              <div
                key={step.id}
                id={`view-step-${step.id}`}
                className={`transition-all duration-200 border rounded-xl overflow-hidden shadow-sm ${
                  isSelected
                    ? "border-indigo-500 bg-white dark:bg-slate-950 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                }`}
              >
                {/* Accordion Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer select-none border-b border-slate-100 dark:border-slate-900/50 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  onClick={() => toggleExpand(step.id)}
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 shadow-sm">
                      {getStepIcon(step.category)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base">{step.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{step.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={getCategoryBadge(step.category)}>
                      {step.category}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div id={`content-step-${step.id}`} className="p-5 space-y-4 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {step.description}
                    </p>

                    {/* Pro Tips / Bulletpoints */}
                    <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-900">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Recomendações Práticas e Regras:
                      </h4>
                      <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                        {step.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="font-semibold text-indigo-500 mt-0.5">•</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Code Snippet with Copy trigger */}
                    {step.codeBlock && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-800/50">
                            {step.codeLanguage || "code"}
                          </span>
                          <button
                            id={`copy-code-${step.id}`}
                            onClick={() => handleCopy(step.codeBlock || "", step.id)}
                            className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1.5 transition-colors focus:outline-none"
                          >
                            {copiedTextId === step.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-medium">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Código</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-900 max-h-[280px]">
                          <code>{step.codeBlock}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
