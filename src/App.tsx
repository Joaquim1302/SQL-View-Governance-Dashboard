import React, { useState } from "react";
import { INITIAL_MANIFEST, INITIAL_SQL_FILES } from "./data";
import type { SQLViewEntry, SqlFile } from "./types";
import GuideSection from "./components/GuideSection";
import GeminiAssistant from "./components/GeminiAssistant";
import { 
  FolderGit, FileCode, CheckCircle, AlertTriangle, Play, Plus, Trash2, Pencil,
  Settings, ExternalLink, Terminal, Cpu, Layers, HelpCircle, Save, Info, RefreshCw,
  Maximize2, Minimize2
} from "lucide-react";

// Centralized default directories for Joaquim
const PATH_D_JOAQUIM = "E:\\Nexus_One\\FASE_3_ Banco_Corporativo\\python\\db";
const PATH_E_JOAQUIM = "E:\\Nexus_One\\FASE_3_ Banco_Corporativo\\python\\sql";

export default function App() {
  // Application State
  const [manifest, setManifest] = useState<SQLViewEntry[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_manifest");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MANIFEST;
  });
  const [sqlFiles, setSqlFiles] = useState<SqlFile[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_sql_files");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SQL_FILES;
  });
  const [selectedViewName, setSelectedViewName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("nexus_selected_view");
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return "cs_manufacturer_br";
  });
  const [executing, setExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    "[READY] Sistema operacional simulado iniciado.",
    "[INFO] Carregando visualizador de manifesto de create_nexus_views_manifests.json...",
    "[GIT] Repositório sincronizado com a branch 'main'."
  ]);
  const [currentTimeStamp, setCurrentTimeStamp] = useState<string>("2026-06-18 04:19:06");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state to localStorage when changed
  React.useEffect(() => {
    try {
      localStorage.setItem("nexus_manifest", JSON.stringify(manifest));
    } catch (e) {
      console.error(e);
    }
  }, [manifest]);

  React.useEffect(() => {
    try {
      localStorage.setItem("nexus_sql_files", JSON.stringify(sqlFiles));
    } catch (e) {
      console.error(e);
    }
  }, [sqlFiles]);

  React.useEffect(() => {
    try {
      localStorage.setItem("nexus_selected_view", selectedViewName);
    } catch (e) {
      console.error(e);
    }
  }, [selectedViewName]);

  const toggleFullscreen = () => {
    const docEl = document.documentElement;
    if (!document.fullscreenElement) {
      docEl.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          addLog("[FULLSCREEN] Modo tela cheia ativado com sucesso.");
        })
        .catch((err) => {
          console.warn("Erro ao ativar tela cheia de dentro do iframe:", err);
          addLog("⚠️ [FULLSCREEN] O navegador bloqueou tela cheia direta do iframe. Dica: Clique no link externo de compartilhamento do app ou use o botão 'Open in new tab' para abrir a aplicação cheia!");
        });
    } else {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          addLog("[FULLSCREEN] Modo tela cheia desativado.");
        })
        .catch((err) => {
          console.error("Erro ao fechar tela cheia:", err);
        });
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // New View form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingViewName, setEditingViewName] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDatabase, setFormDatabase] = useState("nexus");
  const [formPurpose, setFormPurpose] = useState("");
  const [formOwner, setFormOwner] = useState("nexus_user");
  const [formSql, setFormSql] = useState("");
  const [formError, setFormError] = useState("");

  // Configuration Modal state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [manifestDir, setManifestDir] = useState(PATH_D_JOAQUIM);
  const [tempManifestDir, setTempManifestDir] = useState(PATH_D_JOAQUIM);
  const [sqlFilesDir, setSqlFilesDir] = useState(PATH_D_JOAQUIM);
  const [tempSqlFilesDir, setTempSqlFilesDir] = useState(PATH_D_JOAQUIM);

  // Local Physical file storage state helpers
  const [loadingPhysical, setLoadingPhysical] = useState(false);
  const [loadError, setLoadError] = useState("");

  const handleLoadPhysicalManifest = async (dirToLoad: string, sqlDirToLoad: string) => {
    setLoadingPhysical(true);
    setLoadError("");
    try {
      const response = await fetch("/api/manifest/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifestDir: dirToLoad, sqlFilesDir: sqlDirToLoad })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.manifest && Array.isArray(data.manifest)) {
          setManifest(data.manifest);
          if (data.sqlFiles && Array.isArray(data.sqlFiles)) {
            setSqlFiles(prev => {
              const base = [...prev];
              data.sqlFiles.forEach((file: any) => {
                const idx = base.findIndex(f => f.filePath === file.filePath);
                if (idx > -1) {
                  base[idx] = file;
                } else {
                  base.push(file);
                }
              });
              return base;
            });
          }
          
          setManifestDir(dirToLoad);
          setSqlFilesDir(sqlDirToLoad);
          
          // Log success to virtual terminal
          setExecutionLogs(prev => [
            ...prev,
            `[SISTEMA] 📂 Sucesso ao carregar manifesto e views do disco local!`,
            `[MANIFESTO] Carregado de: ${data.loadedFrom}`,
            `[MANIFESTO] Encontrado(s) ${data.manifest.length} registro(s) no arquivo.`
          ]);
          
          setIsConfigModalOpen(false);
        } else {
          setLoadError("O arquivo create_nexus_views_manifests.json não possui formato válido.");
        }
      } else {
        setLoadError(data.error || "create_nexus_views_manifests.json não encontrado nesse diretório.");
      }
    } catch (err: any) {
      setLoadError(`Erro de comunicação com o servidor: ${err.message}`);
    } finally {
      setLoadingPhysical(false);
    }
  };

  // Tabs for Central Panel: "editor" | "assistant" | "guide"
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"editor" | "assistant" | "guide">("editor");

  // Active View Helpers
  const activeView = manifest.find(v => v.view_name === selectedViewName) || manifest[0];
  const activeSqlFile = sqlFiles.find(f => f.filePath === activeView?.sql_file);

  // Validate View Name convention locally
  const validateNamingLocally = (name: string) => {
    const patternValid = /^(cs|vw)_[a-z0-9_]+$/;
    const patternForbidden = /(tmp_|teste|novo|corrigido|backup|products_view_\d+)/i;

    if (!patternValid.test(name)) {
      return { 
        valid: false, 
        reason: "Prefixo ou caracteres inválidos. Deve começar com cs_ (staging) ou vw_ (analítica), contendo apenas letras minúsculas, números e underlines." 
      };
    }
    if (patternForbidden.test(name)) {
      return { 
        valid: false, 
        reason: "O nome contém termos restritos na governança (ex: tmp_, teste, novo, corrigido, backup)." 
      };
    }
    return { valid: true, reason: "" };
  };

  // Verify dependencies between SQLs in the manifest
  const getViewDependencies = (item: SQLViewEntry) => {
    const file = sqlFiles.find(f => f.filePath === item.sql_file);
    const content = file?.content || "";
    const dependsOn: string[] = [];
    const requiredBy: string[] = [];

    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Check which other registered views the current view depends on (references in its SQL)
    manifest.forEach(other => {
      if (other.view_name === item.view_name) return;
      const regex = new RegExp(`\\b${escapeRegExp(other.view_name)}\\b`, 'i');
      if (regex.test(content)) {
        dependsOn.push(other.view_name);
      }
    });

    // Check which other registered views depend on the current view (references current view in their SQL)
    manifest.forEach(other => {
      if (other.view_name === item.view_name) return;
      const otherFile = sqlFiles.find(f => f.filePath === other.sql_file);
      const otherContent = otherFile?.content || "";
      const regex = new RegExp(`\\b${escapeRegExp(item.view_name)}\\b`, 'i');
      if (regex.test(otherContent)) {
        requiredBy.push(other.view_name);
      }
    });

    return { dependsOn, requiredBy };
  };

  // Sort manifest by dependencies so views that are dependencies are built first,
  // and views that depend on them are saved/listed last in create_nexus_views_manifests.json.
  const sortManifestByDependencies = (items: SQLViewEntry[]): SQLViewEntry[] => {
    const sorted: SQLViewEntry[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const getDeps = (item: SQLViewEntry): string[] => {
      const file = sqlFiles.find(f => f.filePath === item.sql_file);
      const content = file?.content || "";
      const deps: string[] = [];
      items.forEach(other => {
        if (other.view_name === item.view_name) return;
        const regex = new RegExp(`\\b${escapeRegExp(other.view_name)}\\b`, 'i');
        if (regex.test(content)) {
          deps.push(other.view_name);
        }
      });
      return deps;
    };

    const visit = (item: SQLViewEntry) => {
      if (visited.has(item.view_name)) return;
      if (visiting.has(item.view_name)) {
        // Recycle dependency or circular chain detected, skip to avoid infinite recursion
        return;
      }

      visiting.add(item.view_name);

      // Visit all dependencies first (so they are placed before this view in the sorted array)
      const deps = getDeps(item);
      deps.forEach(depName => {
        const depItem = items.find(i => i.view_name === depName);
        if (depItem) {
          visit(depItem);
        }
      });

      visiting.delete(item.view_name);
      visited.add(item.view_name);
      sorted.push(item);
    };

    items.forEach(item => {
      visit(item);
    });

    return sorted;
  };

  // Add clean formatted log helper
  const addLog = (msg: string) => {
    setExecutionLogs(prev => [...prev, msg]);
  };

  // Handle REAL & Simulated Deployment of Nexus Views physical files
  const handleDeploySimulator = async () => {
    setExecuting(true);
    setExecutionLogs([]);
    
    const logs: string[] = [];
    logs.push("🚀 [START] Iniciando a gravação física e simulação de deploy...");
    
    // Sort manifest by dependencies so views that have dependencies are saved LAST in create_nexus_views_manifests.json
    const orderedManifest = sortManifestByDependencies(manifest);
    setManifest(orderedManifest);

    const cleanDir = (manifestDir.endsWith("/") || manifestDir.endsWith("\\")) 
      ? manifestDir 
      : (manifestDir.includes("\\") || /^[A-Za-z]:/.test(manifestDir) ? manifestDir + "\\" : manifestDir + "/");

    const cleanSqlDir = (sqlFilesDir.endsWith("/") || sqlFilesDir.endsWith("\\")) 
      ? sqlFilesDir 
      : (sqlFilesDir.includes("\\") || /^[A-Za-z]:/.test(sqlFilesDir) ? sqlFilesDir + "\\" : sqlFilesDir + "/");
    
    logs.push(`📂 [STEP 1] Gravando manifesto físico em: '${cleanDir}create_nexus_views_manifests.json'...`);
    logs.push(`📂 [STEP 1] Gravando scripts SQL em: '${cleanSqlDir}'...`);
    logs.push(`🔄 [STEP 1.5] Ordenando create_nexus_views_manifests por hierarquia de dependência para evitar falhas consecutivas de compilação...`);
    logs.push(`🔍 [STEP 2] Encontrado(s) ${orderedManifest.length} registro(s) de views cadastrados na ordem ideal de criação.`);
    
    let successCount = 0;
    let rejectCount = 0;
    let skipCount = 0;

    orderedManifest.forEach((item) => {
      logs.push(`----------------------------------------`);
      logs.push(`⚙️ Processando View: "${item.view_name}" no banco "${item.database}"`);

      // Check if active
      if (item.status !== "active") {
        logs.push(`⚠️ [PULADO] Status é '${item.status}'. Ignorando implantação desta view.`);
        skipCount++;
        return;
      }

      // Validate Naming Conventions
      const validation = validateNamingLocally(item.view_name);
      if (!validation.valid) {
        logs.push(`❌ [REJEITADO] Violação severa de regras de governança de nomes!`);
        logs.push(`   Motivo do bloqueio: ${validation.reason}`);
        rejectCount++;
        return;
      }

      // Check if SQL file is generated
      const sqlContent = sqlFiles.find(f => f.filePath === item.sql_file);
      if (!sqlContent || !sqlContent.content.trim()) {
        logs.push(`❌ [FALHA] Script SQL não encontrado ou vazio no caminho Git: ${item.sql_file}`);
        rejectCount++;
        return;
      }

      // Simulate Query Compilation and replacement
      logs.push(`✅ [CONEXÃO] Estabelecido túnel seguro com banco '${item.database}'`);
      logs.push(`📝 [SQL] Analisando instrução: "CREATE OR REPLACE VIEW ${item.view_name} AS ..."`);
      logs.push(`✨ [SUCESSO] View "${item.view_name}" implantada/substituída com êxito!`);
      successCount++;
    });

    logs.push(`========================================`);
    logs.push(`💾 [GRAVAÇÃO FÍSICA] Gravando arquivos de fato no sistema local...`);
    
    try {
      const response = await fetch("/api/manifest/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manifestDir,
          sqlFilesDir,
          manifest: orderedManifest,
          sqlFiles
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        logs.push(`✅ [GRAVAÇÃO FÍSICA SUCESSO] Gravado fisicamente '${cleanDir}create_nexus_views_manifests.json'`);
        logs.push(`📂 [GRAVAÇÃO FÍSICA SUCESSO] Gravados ${data.writtenFiles?.length || 0} arquivos SQL relacionados sob demanda.`);
        data.writtenFiles?.forEach((filePath: string) => {
          logs.push(`   📄 -> ${cleanSqlDir}${filePath}`);
        });
      } else {
        logs.push(`⚠️ [GRAVAÇÃO FÍSICA REJEITADA] ${data.error || "Erro ao salvar localmente."}`);
        if (data.details) {
          logs.push(`   Motivo: ${data.details}`);
        }
      }
    } catch (err: any) {
      logs.push(`❌ [GRAVAÇÃO FÍSICA FALHOU] Falha de comunicação com o servidor Express: ${err.message}`);
      logs.push(`   (Se estiver rodando remoto no Cloud Run, essa restrição de gravação externa é esperada. Localmente funciona 100%!)`);
    }

    logs.push(`========================================`);
    logs.push(`🏁 [RELATÓRIO DE DEPLOY] Execução finalizada.`);
    logs.push(`   - Views aplicadas no Banco: ${successCount}`);
    logs.push(`   - Rejeitadas por violação de regras: ${rejectCount}`);
    logs.push(`   - Puladas por marcação de inativo: ${skipCount}`);
    
    if (rejectCount > 0) {
      logs.push(`⚠️ Alerta: Correções são obrigatórias para aplicar itens rejeitados.`);
    } else {
      logs.push(`🎉 Sucesso total! Banco de dados de staging unificado de forma idêntica.`);
    }

    setExecutionLogs(logs);
    setExecuting(false);
    
    // Update Timestamp representation
    const now = new Date();
    setCurrentTimeStamp(now.toISOString().replace('T', ' ').substring(0, 19));
  };

  // Open Edit Modal with selected view details
  const handleOpenEditModal = (item: SQLViewEntry) => {
    const associatedSql = sqlFiles.find(f => f.filePath === item.sql_file)?.content || "";
    setEditingViewName(item.view_name);
    setFormName(item.view_name);
    setFormDatabase(item.database);
    setFormPurpose(item.purpose);
    setFormOwner(item.owner);
    setFormSql(associatedSql);
    setFormError("");
    setIsModalOpen(true);
  };

  // Create or Edit customized view entry
  const handleCreateView = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim() || !formPurpose.trim() || !formSql.trim()) {
      setFormError("Preencha todos os campos obrigatórios.");
      return;
    }

    const cleanName = formName.trim().toLowerCase();
    
    // Predefined file folder pattern
    const sqlFilePath = `sql/views/nexus/${cleanName}.sql`;

    if (editingViewName !== null) {
      // Edit Mode
      // Verify duplication if the name has changed
      if (cleanName !== editingViewName && manifest.some(item => item.view_name === cleanName)) {
        setFormError(`Já existe uma view registrada com o nome "${cleanName}".`);
        return;
      }

      const oldPath = `sql/views/nexus/${editingViewName}.sql`;

      // Update / rename SQL files
      setSqlFiles(prev => {
        const exists = prev.some(f => f.filePath === oldPath);
        if (exists) {
          return prev.map(f => {
            if (f.filePath === oldPath) {
              return { filePath: sqlFilePath, content: formSql };
            }
            return f;
          });
        } else {
          return [...prev, { filePath: sqlFilePath, content: formSql }];
        }
      });

      // Update Manifest Entry
      setManifest(prev => prev.map(item => {
        if (item.view_name === editingViewName) {
          return {
            ...item,
            view_name: cleanName,
            database: formDatabase,
            sql_file: sqlFilePath,
            owner: formOwner || "dev_nexus",
            purpose: formPurpose
          };
        }
        return item;
      }));

      // Update Selected View Name if it was the edited one
      if (selectedViewName === editingViewName) {
        setSelectedViewName(cleanName);
      }

      setExecutionLogs(prev => [
        ...prev,
        `[MANIFESTO] Alterações gravadas na view "${cleanName}"`,
        `[GIT_FS] Arquivo SQL atualizado: ${sqlFilePath}`
      ]);

      // Cleanup
      setEditingViewName(null);
      setFormName("");
      setFormPurpose("");
      setFormSql("");
      setIsModalOpen(false);
    } else {
      // Create Mode
      // Verify duplication
      if (manifest.some(item => item.view_name === cleanName)) {
        setFormError(`Já existe uma view registrada com o nome "${cleanName}".`);
        return;
      }

      // Add new file
      const newSqlFile: SqlFile = {
        filePath: sqlFilePath,
        content: formSql
      };

      // Add manifest entry
      const newManifestEntry: SQLViewEntry = {
        view_name: cleanName,
        database: formDatabase,
        sql_file: sqlFilePath,
        owner: formOwner || "dev_nexus",
        purpose: formPurpose,
        status: "active"
      };

      setSqlFiles(prev => [...prev, newSqlFile]);
      setManifest(prev => [...prev, newManifestEntry]);
      setSelectedViewName(cleanName);
      
      // Add success trace
      setExecutionLogs(prev => [
        ...prev,
        `[GIT_FS] Criado arquivo SQL sob demanda: ${sqlFilePath}`,
        `[MANIFESTO] Registrado "${cleanName}" no create_nexus_views_manifests.json`
      ]);

      // Cleanup
      setFormName("");
      setFormPurpose("");
      setFormSql("");
      setIsModalOpen(false);
    }
  };

  // Delete View from Manifest
  const handleDeleteView = (viewName: string) => {
    const confirmation = window.confirm(`Deseja mesmo revogar a view "${viewName}" do manifesto?`);
    if (!confirmation) return;

    setManifest(prev => prev.filter(v => v.view_name !== viewName));
    
    // Select another active view
    const remaining = manifest.filter(v => v.view_name !== viewName);
    if (remaining.length > 0) {
      setSelectedViewName(remaining[0].view_name);
    }

    setExecutionLogs(prev => [
      ...prev,
      `[MANIFESTO] View "${viewName}" foi removida do create_nexus_views_manifests.json.`
    ]);
  };

  // Toggle View status (Active vs. Inactive)
  const handleToggleStatus = (viewName: string) => {
    setManifest(prev => prev.map(item => {
      if (item.view_name === viewName) {
        const nextStatus = item.status === "active" ? "inactive" : "active";
        return { ...item, status: nextStatus };
      }
      return item;
    }));

    const updatedItem = manifest.find(v => v.view_name === viewName);
    const nextStatusText = updatedItem?.status === "active" ? "Inativa" : "Ativa";
    setExecutionLogs(prev => [
      ...prev,
      `[MANIFESTO] View "${viewName}" definida como '${nextStatusText.toLowerCase()}'.`
    ]);
  };

  // Update specific SQL Content in our list
  const handleUpdateSql = (filePath: string, text: string) => {
    setSqlFiles(prev => prev.map(f => {
      if (f.filePath === filePath) {
        return { ...f, content: text };
      }
      return f;
    }));
  };

  // Callback from AI Assistant to insert newly generated code
  const handleApplyGeneratedSql = (name: string, sql: string, purpose: string, database: string) => {
    const cleanName = name.trim().toLowerCase();
    const filePath = `sql/views/nexus/${cleanName}.sql`;

    // check if it exists in manifest
    const exists = manifest.some(v => v.view_name === cleanName);
    
    if (exists) {
      // Update existing SQL
      setSqlFiles(prev => prev.map(f => f.filePath === filePath ? { ...f, content: sql } : f));
      setManifest(prev => prev.map(item => item.view_name === cleanName ? { ...item, purpose, database } : item));
      setExecutionLogs(prev => [...prev, `[I.A.] Sobrescrito código SQL para a view existente: ${cleanName}`]);
    } else {
      // Add new
      const newSqlFile: SqlFile = { filePath, content: sql };
      const newEntry: SQLViewEntry = {
        view_name: cleanName,
        database,
        sql_file: filePath,
        owner: "ia_nexus",
        purpose,
        status: "active"
      };
      setSqlFiles(prev => [...prev, newSqlFile]);
      setManifest(prev => [...prev, newEntry]);
      setExecutionLogs(prev => [...prev, `[I.A.] Registrada nova view otimizada no manifesto: ${cleanName}`]);
    }
    setSelectedViewName(cleanName);
    setActiveWorkspaceTab("editor");
  };

  const handleClearViews = () => {
    setManifest([]);
    setSqlFiles([]);
    setSelectedViewName("");
    setExecutionLogs([
      "[SISTEMA] 🧹 Limpeza completa realizada com sucesso!",
      "[MANIFESTO] create_nexus_views_manifests.json virtual agora está completamente vazio (0 views de teste no navegador).",
      "[DICA] Use o botão 'Cadastrar Nova View' ou envie uma mensagem no chat da I.A. assistente para registrar as suas views reais!",
      "[DICA EXTRA] Se precisar restaurar os exemplos padrão depois, basta clicar no botão 'Restaurar Exemplos' que aparecerá ao lado!"
    ]);
  };

  const handleRestoreExamples = () => {
    setManifest(INITIAL_MANIFEST);
    setSqlFiles(INITIAL_SQL_FILES);
    setSelectedViewName("cs_manufacturer_br");
    setExecutionLogs([
      "[SISTEMA] 🔄 Modelos e views de exemplo restauradas com sucesso!",
      "[MANIFESTO] create_nexus_views_manifests.json carregou novamente os 5 exemplos de staging e view analítica padrão do Nexus."
    ]);
  };

  return (
    <div className="w-full min-h-screen bg-[#0F172A] text-slate-300 font-sans flex flex-col justify-between select-none" id="app-root-container">
      
      {/* 1. Header Bar styled like a Premium OS/IDE Native TitleBar */}
      <div className="h-11 bg-[#1E293B] flex items-center justify-between px-4 border-b border-slate-800" id="desktop-app-header">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center shadow-lg bg-indigo-950 border border-indigo-500/30">
            <img 
              src="/src/assets/images/favicon_1781991710076.jpg" 
              alt="N1 Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wider text-slate-100 uppercase font-mono">Nexus One™ Controller</span>
            <span className="text-[9px] text-slate-400 font-sans">Administração Portátil de Views SQL</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-300">Git repo: active</span>
          </div>
          <div className="flex items-center gap-3 ml-1 sm:ml-2 border-l border-slate-700/60 pl-3 sm:pl-4">
            <div className="hidden sm:flex items-center gap-4">
              <button 
                id="header-btn-gui-guide"
                onClick={() => {
                  setActiveWorkspaceTab("guide");
                  document.getElementById("guide-section")?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-all"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Ver Roteiro Windows</span>
              </button>
              <span className="text-slate-600">|</span>
              <span className="text-[10.5px] font-mono text-slate-400">v1.0.4</span>
              <span className="text-slate-600">|</span>
            </div>
            
            <button
              id="fullscreen-toggle-btn"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/40 rounded transition-all"
              title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden xs:inline">{isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}</span>
            </button>

            <button
              id="header-btn-config-manifest"
              onClick={() => {
                setTempManifestDir(manifestDir);
                setTempSqlFilesDir(sqlFilesDir);
                setIsConfigModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/40 rounded transition-all"
              title="Configurações"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xs:inline">Configurações</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Layout: Sidebar Project Explorer + Main Content Pane */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" id="workspace-grid-container">
        
        {/* SIDEBAR EXPLORER */}
        <aside className="w-full md:w-64 bg-[#0B0F19] border-r border-slate-800/80 p-4 flex flex-col space-y-5" id="explorer-sidebar">
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              <span>Rastreador Local Git</span>
              <span className="font-mono text-slate-600">sql/views/</span>
            </div>
            
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 bg-slate-900/40 rounded border border-slate-800/60 font-mono text-xs">
                <span>📁 nexus/</span>
              </div>

              {manifest.map((item) => {
                const isSelected = item.view_name === selectedViewName;
                const convention = validateNamingLocally(item.view_name);
                return (
                  <button
                    key={item.view_name}
                    id={`sidebar-item-${item.view_name}`}
                    onClick={() => {
                      setSelectedViewName(item.view_name);
                      setActiveWorkspaceTab("editor");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-1.5 rounded text-left transition-all text-xs font-mono group border ${
                      isSelected 
                        ? "bg-indigo-950/40 text-indigo-300 border-indigo-900/60 font-semibold" 
                        : "hover:bg-slate-900 text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-400" : "text-slate-500Group hover:text-slate-300"}`} />
                      <span className="truncate">{item.view_name}.sql</span>
                    </div>

                    {!convention.valid && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Inválido: Desrespeita a regra de nomenclatura" />
                    )}
                  </button>
                );
              })}

              <button
                id="sidebar-manifest-indicator"
                onClick={() => {
                  setSelectedViewName("");
                  setActiveWorkspaceTab("editor");
                }}
                className="w-full flex items-center gap-2 px-2 py-2 mt-4 text-slate-300 bg-slate-900/60 rounded border border-slate-800 hover:bg-slate-800/80 hover:text-white transition-all text-left font-mono text-xs"
              >
                <FolderGit className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold">create_nexus_views_manifests.json</span>
              </button>
            </div>
          </div>

          {/* Quick Info Box about Suffix Naming Guide */}
          <div className="mt-auto bg-slate-950/60 border border-slate-800/60 p-3 rounded-lg space-y-2.5" id="suffix-definitions-box">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prefixos de Governança</span>
            </h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="font-mono text-emerald-400 font-bold">cs_</span>
                <span className="text-slate-400 text-[10px] text-right">Consulta Estruturada/Staging</span>
              </div>
              <div className="flex items-start justify-between bg-slate-900 p-1.5 rounded border border-slate-800 font-mono">
                <span className="font-mono text-blue-400 font-bold">vw_</span>
                <span className="text-slate-400 text-[10px] text-right">View Analítica / Relatório</span>
              </div>
              <div className="flex items-start justify-between bg-rose-950/30 p-1.5 rounded border border-rose-900/30 text-rose-300">
                <span className="font-mono font-bold text-rose-400">tmp_</span>
                <span className="text-rose-400 text-[10px] text-right">Proibido Permanente</span>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN BODY AREA */}
        <main className="flex-1 bg-[#090D1A] flex flex-col p-4 sm:p-6 lg:p-8 space-y-6" id="main-scrollable-workspace">
          
          {/* Top Info Banner & Quick Switch Tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-indigo-400 font-mono tracking-widest uppercase">Repositório Virtual</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-bold font-mono">Git-First</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight font-sans">Gerenciador de SQL Views</h1>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Nenhuma view é criada solta no Workbench. Forçamos a validação de arquivos no Git integrando o controle de arquivo manifesto <code>create_nexus_views_manifests.json</code> de forma automatizada.
              </p>
            </div>

            {/* Simulated Desktop Actions */}
            <div className="flex flex-wrap gap-2.5">

              <button
                id="btn-open-create-modal"
                onClick={() => {
                  setEditingViewName(null);
                  setFormName("");
                  setFormDatabase("nexus");
                  setFormPurpose("");
                  setFormOwner("nexus_user");
                  setFormSql("");
                  setFormError("");
                  setIsModalOpen(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700/60 shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Cadastrar Nova View
              </button>

              <button
                id="btn-deploy-active-views"
                disabled={executing || manifest.length === 0}
                onClick={handleDeploySimulator}
                className={`px-5 py-2 rounded-lg text-xs font-semibold shadow-lg transition-all flex items-center gap-2 uppercase tracking-wide ${
                  manifest.length === 0 
                  ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800" 
                  : "bg-[#6366F1] hover:bg-indigo-500 text-white shadow-indigo-600/20"
                }`}
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Deploy do Manifesto</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Workspace Views Navigation tabs */}
          <div className="flex space-x-1.5 border-b border-slate-800" id="workspace-tabs-navigator">
            <button
              id="workspace-tab-editor"
              onClick={() => setActiveWorkspaceTab("editor")}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all ${
                activeWorkspaceTab === "editor"
                  ? "bg-[#111827] border-slate-800 text-white border-t-2 border-t-indigo-500"
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manifesto & Editor</span>
            </button>

            <button
              id="workspace-tab-assistant"
              onClick={() => setActiveWorkspaceTab("assistant")}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all ${
                activeWorkspaceTab === "assistant"
                  ? "bg-[#111827] border-slate-800 text-white border-t-2 border-t-indigo-500"
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Validador de IA Gemini</span>
            </button>

            <button
              id="workspace-tab-guide"
              onClick={() => setActiveWorkspaceTab("guide")}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all ${
                activeWorkspaceTab === "guide"
                  ? "bg-[#111827] border-slate-800 text-white border-t-2 border-t-indigo-500"
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instruções Desktop Windows</span>
            </button>
          </div>

          {/* TAB CONTENT SPACES */}
          {activeWorkspaceTab === "editor" && (
            <div id="tab-content-editor" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Manifest List Table & Selected details */}
              <div className="lg:col-span-6 space-y-4">
                
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FolderGit className="w-4 h-4 text-indigo-400" />
                      <span>Configurações do Manifesto</span>
                    </h3>
                    <code className="text-[10px] text-indigo-400 font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded" title="Diretório de gravação configurado">
                      {((manifestDir.endsWith("/") || manifestDir.endsWith("\\")) 
                        ? manifestDir 
                        : (manifestDir.includes("\\") || /^[A-Za-z]:/.test(manifestDir) ? manifestDir + "\\" : manifestDir + "/")) + "create_nexus_views_manifests.json"}
                    </code>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans">
                    Lista oficial que o aplicativo em Python lerá. Qualquer view que não estiver aqui com o status <code>active</code> será pulada pelo script de automação.
                  </p>

                  <div className="space-y-2 mt-4 max-h-[360px] overflow-y-auto pr-1">
                    {manifest.map((item) => {
                      const isSelected = item.view_name === selectedViewName;
                      const namingCheck = validateNamingLocally(item.view_name);
                      
                      return (
                        <div
                          key={item.view_name}
                          id={`manifest-card-${item.view_name}`}
                          className={`p-3 rounded-lg border transition-all text-xs space-y-2 ${
                            isSelected 
                              ? "bg-slate-900 border-indigo-600/70"
                              : "bg-[#0B0F19] hover:bg-slate-900/30 border-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              id={`select-view-${item.view_name}`}
                              onClick={() => setSelectedViewName(item.view_name)}
                              className="font-mono font-semibold text-slate-200 hover:text-indigo-400 text-left truncate flex-1"
                            >
                              {item.view_name}
                            </button>
                            <div className="flex items-center space-x-2">
                              <button
                                id={`toggle-status-${item.view_name}`}
                                onClick={() => handleToggleStatus(item.view_name)}
                                className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                                  item.status === 'active'
                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                {item.status === 'active' ? 'Ativo' : 'Inativo'}
                              </button>
                              
                              <button
                                id={`edit-view-${item.view_name}`}
                                onClick={() => handleOpenEditModal(item)}
                                className="text-slate-500 hover:text-indigo-400 p-0.5 transition-colors"
                                title="Editar view"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                id={`delete-view-${item.view_name}`}
                                onClick={() => handleDeleteView(item.view_name)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                                title="Remover do manifesto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-1 italic font-sans">
                            {item.purpose}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                            <span>DB: {item.database}</span>
                             {(() => {
                               const deps = getViewDependencies(item);
                               const hasDeps = deps.dependsOn.length > 0 || deps.requiredBy.length > 0;
                               if (hasDeps) {
                                 const tooltipParts: string[] = [];
                                 if (deps.dependsOn.length > 0) {
                                   tooltipParts.push(`Depende de:\n- ${deps.dependsOn.join("\n- ")}`);
                                 }
                                 if (deps.requiredBy.length > 0) {
                                   tooltipParts.push(`Usado por:\n- ${deps.requiredBy.join("\n- ")}`);
                                 }
                                 const tooltipText = tooltipParts.join("\n\n");
                                 return (
                                   <span 
                                     className={deps.requiredBy.length > 0
                                       ? "text-emerald-400 font-sans font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[9px] flex items-center gap-1 cursor-help uppercase"
                                       : "text-orange-400 font-sans font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 text-[9px] flex items-center gap-1 cursor-help uppercase"
                                     }
                                     title={tooltipText}
                                   >
                                     <Layers className="w-2.5 h-2.5" />
                                     Link: {deps.dependsOn.length + deps.requiredBy.length}
                                   </span>
                                 );
                               }
                               return null;
                             })()}
                            <span>Dono: {item.owner}</span>
                          </div>

                          {/* Render severe validation warning red block if not compliant */}
                          {!namingCheck.valid && (
                            <div className="bg-rose-950/30 border border-rose-900/30 text-rose-400 p-2 rounded text-[10.5px] leading-relaxed flex items-start gap-1.5 mt-2">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <p><strong>Bloqueio de Regra:</strong> {namingCheck.reason}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Code Editor Preview & edit capacity */}
              <div className="lg:col-span-6 space-y-4">
                
                {activeView ? (
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono">ARQUIVO SELECIONADO</span>
                          <h3 className="text-xs font-mono font-bold text-indigo-400">
                            {activeView.sql_file}
                          </h3>
                        </div>
                        <span className="text-[9px] bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-900/40 uppercase">
                          Sincronizado no Git
                        </span>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Código SQL da View:</span>
                          <span className="text-[10px] text-slate-500 italic">Você pode editar este campo para testar o deploy</span>
                        </div>

                        <textarea
                          id="view-code-editor"
                          rows={11}
                          value={activeSqlFile?.content || ""}
                          onChange={(e) => handleUpdateSql(activeView.sql_file, e.target.value)}
                          className="w-full bg-[#070A12] text-slate-200 border border-slate-800 font-mono text-xs p-3 focus:outline-none focus:border-indigo-500/80 rounded-lg font-light leading-relaxed resize-none"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2 mt-4 text-xs">
                      <span className="font-semibold text-slate-300 block">Metadados Controlados:</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>
                          <strong>Filtrar Banco:</strong> <code>{activeView.database}</code>
                        </div>
                        <div>
                          <strong>Desenvolvedor:</strong> <code>{activeView.owner}</code>
                        </div>
                        <div className="col-span-2">
                          <strong>Propósito:</strong> <span className="italic">{activeView.purpose}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                    <AlertTriangle className="w-8 h-8 text-indigo-400" />
                    <p className="text-sm font-semibold">Nenhuma view selecionada no manifesto.</p>
                    <p className="text-xs text-slate-500">Cadastre uma view ou selecione arquivos na barra lateral.</p>
                  </div>
                )}

              </div>

            </div>
          )}

          {activeWorkspaceTab === "assistant" && (
            <div id="tab-content-assistant" className="animate-fadeIn">
              <GeminiAssistant
                currentSQL={activeSqlFile?.content || ""}
                currentName={activeView?.view_name || ""}
                currentDatabase={activeView?.database || "nexus"}
                onApplySQL={handleApplyGeneratedSql}
              />
            </div>
          )}

          {activeWorkspaceTab === "guide" && (
            <div id="tab-content-guide" className="animate-fadeIn">
              <GuideSection />
            </div>
          )}

          {/* SIMULATED CONSOLE LOGS AT THE BOTTOM CONTAINER */}
          <div className="mt-4 bg-[#080B13] border border-slate-800 rounded-xl flex flex-col shadow-inner overflow-hidden" id="execution-logs-console">
            <div className="px-4 py-2 bg-[#121824] border-b border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Terminal de Implantação - create_nexus_views.py
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Última Execução: {currentTimeStamp}</span>
            </div>
            
            <div className="p-4 font-mono text-[11px] space-y-1.5 bg-[#05080E] max-h-52 overflow-y-auto text-slate-300">
              {executionLogs.map((log, index) => {
                let logClass = "text-slate-400";
                if (log.includes("[SUCCESS]") || log.includes("✨") || log.includes("🎉") || log.includes("✅")) {
                  logClass = "text-emerald-400 font-medium";
                } else if (log.includes("❌") || log.includes("[REJEITADO]")) {
                  logClass = "text-rose-400 font-semibold";
                } else if (log.includes("⚠️") || log.includes("[PULADO]")) {
                  logClass = "text-amber-400";
                } else if (log.includes("🚀") || log.includes("[START]")) {
                  logClass = "text-indigo-400 font-semibold";
                }
                return (
                  <div key={index} className={logClass} id={`log-item-${index}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      </div>

      {/* 3. Bottom Status Bar mimicking Windows Style aesthetics */}
      <footer className="h-6 bg-indigo-600 flex items-center px-4 justify-between text-[10px] font-medium text-white-900 bg-gradient-to-r from-indigo-700 to-indigo-600 border-t border-indigo-500" id="windows-status-footer">
        <div className="flex items-center gap-4 text-white">
          <span className="font-bold tracking-widest uppercase">PRONTO</span>
          <span className="opacity-50">|</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Nexus One Monitor Ativo
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-slate-100">
          <span>Views no Manifesto: {manifest.length}</span>
          <span className="opacity-50">|</span>
          <span>UTF-8</span>
          <span className="opacity-50">|</span>
          <span>SQL: MySQL / PostgreSQL</span>
        </div>
      </footer>

      {/* NEW VIEW CADASTER MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="cadastro-view-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                {editingViewName !== null ? (
                  <Pencil className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Plus className="w-4 h-4 text-indigo-400" />
                )}
                <span>{editingViewName !== null ? "Editar View no Git & Manifesto" : "Registrar Nova View no Git & Manifesto"}</span>
              </h3>
              <button 
                id="btn-close-modal"
                onClick={() => {
                  setEditingViewName(null);
                  setIsModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-200 text-base"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-900 rounded-lg text-rose-400 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateView} className="space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">
                  Nome da View (Ex: <code>cs_manufacturer_br</code>):
                </label>
                <input
                  id="modal-input-view-name"
                  type="text"
                  required
                  placeholder="Inicie com cs_ ou vw_. Evite tmp_"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 text-xs border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Banco de Dados:</label>
                  <select
                    id="modal-select-database"
                    value={formDatabase}
                    onChange={(e) => setFormDatabase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="nexus">nexus</option>
                    <option value="nexus_sales">nexus_sales</option>
                    <option value="magento">magento</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Autor / Dono:</label>
                  <input
                    id="modal-input-owner"
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    placeholder="fase_03"
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">Descrição / Propósito:</label>
                <input
                  id="modal-input-purpose"
                  type="text"
                  required
                  placeholder="Normalizar tabelas e converter ID"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">Script SQL da View:</label>
                <textarea
                  id="modal-input-sql"
                  required
                  rows={4}
                  placeholder="SELECT col1, col2 FROM tabela WHERE ..."
                  value={formSql}
                  onChange={(e) => setFormSql(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  id="modal-btn-cancel"
                  type="button"
                  onClick={() => {
                    setEditingViewName(null);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  id="modal-btn-submit"
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow"
                >
                  {editingViewName !== null ? "Confirmar Alterações" : "Confirmar Registro"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIG MANIFEST DIR MODAL DIALOG */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="config-manifest-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Configurações</span>
              </h3>
              <button 
                id="btn-close-config-modal"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-400 leading-relaxed font-sans font-medium">
                Defina o diretório onde o arquivo <code className="text-indigo-300 font-bold font-mono">create_nexus_views_manifests.json</code> e os scripts individuais <code className="text-indigo-300 font-bold font-mono">.sql</code> serão lidos e gravados.
              </p>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Diretório do Manifesto (create_nexus_views_manifests.json):</label>
                  <div className="flex gap-2">
                    <input
                      id="config-input-dir"
                      type="text"
                      required
                      placeholder="./"
                      value={tempManifestDir}
                      onChange={(e) => setTempManifestDir(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block italic mt-0.5 font-sans">
                    Diretório base onde se localiza o arquivo create_nexus_views_manifests.json
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Diretório dos Scripts SQL (.sql):</label>
                  <div className="flex gap-2">
                    <input
                      id="config-input-sql-dir"
                      type="text"
                      required
                      placeholder="./"
                      value={tempSqlFilesDir}
                      onChange={(e) => setTempSqlFilesDir(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block italic mt-0.5 font-sans">
                    Diretório onde os scripts em formato .sql serão salvos e gerados
                  </span>
                </div>
              </div>

              {/* Quick Directory Presets to make it look even more professional */}
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Configurações Rápidas de Diretório:</span>
                <div className="flex flex-wrap gap-1.5 font-mono">
                  {/* 
                  <button
                    type="button"
                    onClick={() => {
                      setTempManifestDir("./");
                      setTempSqlFilesDir("./");
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] hover:text-white transition-all font-mono"
                    title="Configura a pasta raiz para ambos os diretórios"
                  >
                    Raiz (./)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempManifestDir("sql/views/");
                      setTempSqlFilesDir("sql/views/");
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] hover:text-white transition-all font-mono"
                    title="Configura ambos para a subpasta sql/views/"
                  >
                    sql/views/
                  </button>
                  */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempManifestDir(PATH_D_JOAQUIM);
                      setTempSqlFilesDir(PATH_D_JOAQUIM);
                    }}
                    className="bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900 text-indigo-300 px-2 py-1 rounded text-[10px] hover:text-white transition-all font-mono font-semibold"
                    title={`Define ambos para o caminho local padrão: ${PATH_D_JOAQUIM}`}
                  >
                    Unificar em: {PATH_D_JOAQUIM}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempManifestDir(PATH_D_JOAQUIM);
                      setTempSqlFilesDir(PATH_E_JOAQUIM);
                    }}
                    className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900 text-emerald-300 px-2 py-1 rounded text-[10px] hover:text-white transition-all font-mono font-semibold"
                    title={`Define drives independentes: Manifesto em ${PATH_D_JOAQUIM} e SQLs em ${PATH_E_JOAQUIM}`}
                  >
                    Separar: {PATH_D_JOAQUIM.split(":")[0] || "D"}: (Manifesto) e {PATH_E_JOAQUIM.split(":")[0] || "E"}: (SQLs)
                  </button>
                </div>
                
                {/* Descriptive Alert on Directory Freedom */}
                <div className="bg-slate-900/60 p-2 rounded text-[10.5px] border border-slate-800 text-slate-400 font-sans leading-relaxed">
                  💡 <strong className="text-slate-300">Drives Independentes:</strong> Os diretórios são totalmente desacoplados! Você pode, por exemplo, manter o manifesto <code className="text-indigo-300 font-mono text-[10px]">create_nexus_views_manifests.json</code> na unidade <span className="text-indigo-400 font-bold">{PATH_D_JOAQUIM.split(":")[0] || "D"}:</span> e salvar os arquivos <code className="text-indigo-300 font-mono text-[10px]">.sql</code> na unidade <span className="text-emerald-400 font-bold">{PATH_E_JOAQUIM.split(":")[0] || "E"}:</span>.
                </div>
              </div>

              {/* Visual preview of full path */}
              <div className="bg-indigo-950/20 text-indigo-300 p-2.5 rounded font-mono text-[10.5px] border border-indigo-900/30 space-y-2">
                <div>
                  <span className="text-indigo-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5 font-sans">Caminho do Manifesto:</span>
                  <div className="text-slate-300 break-all">
                    {((tempManifestDir.endsWith("/") || tempManifestDir.endsWith("\\")) 
                      ? tempManifestDir 
                      : (tempManifestDir.includes("\\") || /^[A-Za-z]:/.test(tempManifestDir) ? tempManifestDir + "\\" : tempManifestDir + "/")) + "create_nexus_views_manifests.json"}
                  </div>
                </div>
                <div>
                  <span className="text-indigo-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5 font-sans">Caminho de Gravação das .sql's:</span>
                  <div className="text-emerald-400 break-all">
                    {((tempSqlFilesDir.endsWith("/") || tempSqlFilesDir.endsWith("\\")) 
                      ? tempSqlFilesDir 
                      : (tempSqlFilesDir.includes("\\") || /^[A-Za-z]:/.test(tempSqlFilesDir) ? tempSqlFilesDir + "\\" : tempSqlFilesDir + "/")) + "sql/[grupo]/[arquivo].sql"}
                  </div>
                </div>
              </div>

              {/* Physical Load Option */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Sincronizar do Disco Local:</span>
                <p className="text-[11px] text-slate-500 font-sans leading-snug">
                  Caso já possua um arquivo <code className="text-slate-400 font-mono">create_nexus_views_manifests.json</code> na pasta selecionada, você pode carregar as views e códigos SQL para este aplicativo:
                </p>
                <div className="flex gap-2">
                  <button
                    id="config-btn-load-physical"
                    type="button"
                    disabled={loadingPhysical}
                    onClick={() => handleLoadPhysicalManifest(tempManifestDir, tempSqlFilesDir)}
                    className="w-full bg-slate-800 hover:bg-slate-705 text-slate-200 border border-slate-700 py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5 font-semibold"
                  >
                    {loadingPhysical ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <FolderGit className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ler create_nexus_views_manifests.json do Disco</span>
                      </>
                    )}
                  </button>
                </div>
                {loadError && (
                  <div className="text-[10.5px] bg-rose-950/40 text-rose-300 border border-rose-900/40 rounded p-2 italic font-sans flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                    <span>{loadError}</span>
                  </div>
                )}
              </div>

              {/* Data Examples Management */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Gerenciamento de Exemplos:</span>
                <p className="text-[11px] text-slate-500 font-sans leading-snug">
                  Limpe ou restaure as views de exemplo padrão carregadas no navegador para fins de teste.
                </p>
                <div className="flex gap-2">
                  {manifest.length > 0 ? (
                    <button
                      id="config-btn-clear-all"
                      type="button"
                      onClick={() => {
                        handleClearViews();
                        setIsConfigModalOpen(false);
                      }}
                      className="w-full bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 hover:text-rose-200 border border-rose-900/50 py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5 font-semibold"
                      title="Remover todas as views de teste atuais para cadastrar as reais"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Limpar Exemplos</span>
                    </button>
                  ) : (
                    <button
                      id="config-btn-restore-examples"
                      type="button"
                      onClick={() => {
                        handleRestoreExamples();
                        setIsConfigModalOpen(false);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-900/40 py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5 font-semibold"
                      title="Restaurar as views de teste do manifesto inicial"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Restaurar Exemplos</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  id="config-btn-cancel"
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  id="config-btn-save"
                  type="button"
                  onClick={() => {
                    setManifestDir(tempManifestDir);
                    setSqlFilesDir(tempSqlFilesDir);
                    const cleanD = tempManifestDir.endsWith("/") || tempManifestDir.endsWith("\\") ? tempManifestDir : tempManifestDir + "/";
                    const cleanSqlD = tempSqlFilesDir.endsWith("/") || tempSqlFilesDir.endsWith("\\") ? tempSqlFilesDir : tempSqlFilesDir + "/";
                    setExecutionLogs(prev => [
                      ...prev,
                      `[SISTEMA] Diretório do manifesto atualizado para: ${cleanD}`,
                      `[MANIFESTO] Novo local do arquivo: ${cleanD}create_nexus_views_manifests.json`,
                      `[SISTEMA] Diretório de gravação de .sql atualizado para: ${cleanSqlD}`
                    ]);
                    setIsConfigModalOpen(false);
                  }}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow transition-all"
                >
                  Salvar Configuração
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
