import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini SDK using safe, lazy initialization pattern
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY environment variable is not defined.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Ensure the client is checked/prepared
try {
  getGeminiClient();
} catch (err) {
  console.error("Failed to initialize Gemini client on boot:", err);
}

// API Routes

// Route 1: Validate SQL view code and naming conventions using Gemini
app.post("/api/gemini/validate", async (req, res) => {
  const { viewName, sqlContent, database } = req.body;

  if (!viewName || !sqlContent) {
    return res.status(400).json({ error: "viewName and sqlContent are required." });
  }

  try {
    const systemInstruction = `You are an expert SQL DBA and database architect specializing in SQL Views management, query performance, and standardization.
Assess the provided SQL View and its name against these strict Brazilian standard governance guidelines:
1. View Names must follow prefix guidelines:
   - "cs_" : Camada staging / Consulta estruturada (e.g., cs_manufacturer_br, cs_inventory_current).
   - "vw_" : View analítica / relatórios.
   - Forbidden entirely: prefixing or naming with "tmp_", "teste_", or contains labels like "_novo", "_corrigido", "backup", "products_view_2".
2. The view should aim to be clean, normalized, safe, and efficient.
3. Language format is Portuguese (pt-BR).

Respond ONLY in a JSON block matching this TypeScript type scheme:
{
  "prefixValid": boolean,
  "namingFeedback": string,
  "prefixType": "cs" | "vw" | "invalid",
  "criticism": string, 
  "optimizedSql": string,
  "suggestions": string[]
}`;

    const client = getGeminiClient();
    const prompt = `Por favor, analise a seguinte view SQL para o banco de dados "${database || "nexus"}":
Nome da View: ${viewName}
SQL:
${sqlContent}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prefixValid: { type: Type.BOOLEAN },
            namingFeedback: { type: Type.STRING },
            prefixType: { type: Type.STRING },
            criticism: { type: Type.STRING },
            optimizedSql: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["prefixValid", "namingFeedback", "prefixType", "criticism", "optimizedSql", "suggestions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini validate error:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao processar a validação com a IA.",
      details: error.message
    });
  }
});

// Route 2: Generate View boilerplate based on prompt
app.post("/api/gemini/generate-view", async (req, res) => {
  const { userPrompt, dbContext } = req.body;

  if (!userPrompt) {
    return res.status(400).json({ error: "userPrompt is required." });
  }

  try {
    const systemInstruction = `You are an database engineer helping to build standardized Views following strict governance.
Based on the user's plain explanation of what data they want to query, decide:
1. A compliant view name following standard naming conventions starting with:
   - "cs_" (Staging view)
   - "vw_" (Analytical view)
2. A high-quality SQL view definition (MySQL / PostgreSQL format) with normalized translations if needed (e.g. Pt-Br).
3. Database to associate (defaulting to "nexus" or similar context).
4. Slogan/purpose description in pt-BR.

Respond ONLY with JSON matching:
{
  "viewName": string,
  "database": string,
  "purpose": string,
  "sqlCode": string,
  "reasoning": string
}`;

    const client = getGeminiClient();
    const prompt = `Requisito do usuário: "${userPrompt}"\nContexto ou banco de dados preferido: "${dbContext || "nexus"}"`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            viewName: { type: Type.STRING },
            database: { type: Type.STRING },
            purpose: { type: Type.STRING },
            sqlCode: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["viewName", "database", "purpose", "sqlCode", "reasoning"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini generate-view error:", error);
    return res.status(500).json({
      error: "Erro ao gerar código da View com inteligência artificial.",
      details: error.message
    });
  }
});

// Route 3: Physical Save/Deploy of Manifest and SQL files in custom directory
app.post("/api/manifest/deploy", (req, res) => {
  const { manifestDir, sqlFilesDir, manifest, sqlFiles } = req.body;
  if (!manifestDir) {
    return res.status(400).json({ error: "O parâmetro manifestDir é obrigatório." });
  }

  try {
    let cleanDir = manifestDir;
    // Normalize path separators based on input
    if (!cleanDir.endsWith("/") && !cleanDir.endsWith("\\")) {
      if (cleanDir.includes("\\") || /^[A-Za-z]:/.test(cleanDir)) {
        cleanDir += "\\";
      } else {
        cleanDir += "/";
      }
    }

    let cleanSqlDir = sqlFilesDir || manifestDir;
    if (!cleanSqlDir.endsWith("/") && !cleanSqlDir.endsWith("\\")) {
      if (cleanSqlDir.includes("\\") || /^[A-Za-z]:/.test(cleanSqlDir)) {
        cleanSqlDir += "\\";
      } else {
        cleanSqlDir += "/";
      }
    }

    console.log(`[MANIFEST DEPLOY] Gravando manifesto físico em: ${cleanDir}`);
    console.log(`[MANIFEST DEPLOY] Gravando arquivos SQL em: ${cleanSqlDir}`);

    // Create the directory recursively if it doesn't exist
    if (!fs.existsSync(cleanDir)) {
      fs.mkdirSync(cleanDir, { recursive: true });
    }

    if (!fs.existsSync(cleanSqlDir)) {
      fs.mkdirSync(cleanSqlDir, { recursive: true });
    }

    // Save create_nexus_views_manifests.json
    const manifestPath = path.join(cleanDir, "create_nexus_views_manifests.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    // Save individual .sql files
    const writtenFiles: string[] = [];
    if (sqlFiles && Array.isArray(sqlFiles)) {
      for (const file of sqlFiles) {
        if (!file.filePath) continue;
        
        // Ensure directories for individual SQL files exist too
        const fullSqlPath = path.join(cleanSqlDir, file.filePath);
        const sqlDir = path.dirname(fullSqlPath);
        
        if (!fs.existsSync(sqlDir)) {
          fs.mkdirSync(sqlDir, { recursive: true });
        }

        fs.writeFileSync(fullSqlPath, file.content || "", "utf-8");
        writtenFiles.push(file.filePath);
      }
    }

    return res.json({
      success: true,
      message: "Manifesto e scripts SQL gravados localmente no diretório com sucesso!",
      manifestPath,
      writtenFiles
    });
  } catch (err: any) {
    console.error("Erro ao gravar manifesto fisico no disco:", err);
    return res.status(500).json({
      error: "Não foi possível gravar o arquivo manifesto localmente.",
      details: err.message
    });
  }
});

// Route 4: Physical Loading of Manifest and SQL files from custom directory
app.post("/api/manifest/load", (req, res) => {
  const { manifestDir, sqlFilesDir } = req.body;
  if (!manifestDir) {
    return res.status(400).json({ error: "O parâmetro manifestDir é obrigatório." });
  }

  try {
    let cleanDir = manifestDir;
    if (!cleanDir.endsWith("/") && !cleanDir.endsWith("\\")) {
      if (cleanDir.includes("\\") || /^[A-Za-z]:/.test(cleanDir)) {
        cleanDir += "\\";
      } else {
        cleanDir += "/";
      }
    }

    let cleanSqlDir = sqlFilesDir || manifestDir;
    if (!cleanSqlDir.endsWith("/") && !cleanSqlDir.endsWith("\\")) {
      if (cleanSqlDir.includes("\\") || /^[A-Za-z]:/.test(cleanSqlDir)) {
        cleanSqlDir += "\\";
      } else {
        cleanSqlDir += "/";
      }
    }

    const manifestPath = path.join(cleanDir, "create_nexus_views_manifests.json");
    if (!fs.existsSync(manifestPath)) {
      return res.status(404).json({
        error: `Arquivo create_nexus_views_manifests.json não encontrado no diretório: ${cleanDir}`
      });
    }

    // Load manifest
    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    const manifestData = JSON.parse(manifestContent);

    // Load associated SQL files listed in the manifest
    const sqlFilesList: { filePath: string; content: string }[] = [];
    if (Array.isArray(manifestData)) {
      for (const item of manifestData) {
        if (item.sql_file) {
          const fullSqlPath = path.join(cleanSqlDir, item.sql_file);
          if (fs.existsSync(fullSqlPath)) {
            const sqlContent = fs.readFileSync(fullSqlPath, "utf-8");
            sqlFilesList.push({
              filePath: item.sql_file,
              content: sqlContent
            });
          }
        }
      }
    }

    return res.json({
      success: true,
      manifest: manifestData,
      sqlFiles: sqlFilesList,
      loadedFrom: manifestPath
    });
  } catch (err: any) {
    console.error("Erro ao ler manifesto fisico do disco:", err);
    return res.status(500).json({
      error: "Falha ao ler dados do manifesto local.",
      details: err.message
    });
  }
});

// Configure Vite or Static Files depending on Environment

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SQL View Governance App running on http://localhost:${PORT}`);
  });
}

startServer();
