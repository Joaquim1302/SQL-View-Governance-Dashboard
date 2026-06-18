import { SQLViewEntry, SqlFile, DevelopmentGuideStep } from "./types";

export const INITIAL_MANIFEST: SQLViewEntry[] = [
  {
    "view_name": "cs_manufacturer_br",
    "database": "prestashop",
    "sql_file": "sql/views/presta/cs_manufacturer_br.sql",
    "owner": "fase_03",
    "purpose": "Normalizar fabricantes do Prestashop em idioma pt-BR excluindo registros nulos",
    "status": "active"
  },
  {
    "view_name": "cs_products_br",
    "database": "prestashop",
    "sql_file": "sql/views/presta/cs_products_br.sql",
    "owner": "fase_03",
    "purpose": "Consolidar produtos com nomes em pt-BR e precos convertidos",
    "status": "active"
  },
  {
    "view_name": "cs_product_variants_br",
    "database": "prestashop",
    "sql_file": "sql/views/presta/cs_product_variants_br.sql",
    "owner": "analista_nexus",
    "purpose": "Staging de variacoes de produtos, atributos e estoque original",
    "status": "active"
  },
  {
    "view_name": "vw_inventory_current",
    "database": "prestashop",
    "sql_file": "sql/views/presta/vw_inventory_current.sql",
    "owner": "gerencia",
    "purpose": "Relatorio consolidado de estoque atual para tomadores de decisao",
    "status": "active"
  },
  {
    "view_name": "tmp_test_view",
    "database": "prestashop",
    "sql_file": "sql/views/presta/tmp_test_view.sql",
    "owner": "estagiario",
    "purpose": "View temporaria para validacao de campos de auditoria (Forbidden)",
    "status": "inactive"
  }
];

export const INITIAL_SQL_FILES: SqlFile[] = [
  {
    filePath: "sql/views/presta/cs_manufacturer_br.sql",
    content: `-- normalizacao de fabricantes para idioma pt-BR
SELECT 
    m.id_manufacturer AS id_fabricante,
    m.name AS nome,
    m.date_add AS data_cadastro,
    m.active AS ativo,
    'pt-BR' AS idioma_operacao
FROM ps_manufacturer m
INNER JOIN ps_manufacturer_lang ml ON (m.id_manufacturer = ml.id_manufacturer)
WHERE m.active = 1;`
  },
  {
    filePath: "sql/views/presta/cs_products_br.sql",
    content: `-- consolidacao de produtos ativos em pt-BR
SELECT 
    p.id_product AS id_produto,
    p.reference AS referencia,
    pl.name AS nome_produto,
    p.price AS preco_base,
    p.active AS ativo
FROM ps_product p
INNER JOIN ps_product_lang pl ON (p.id_product = pl.id_product)
WHERE pl.id_lang = 1 AND p.active = 1;`
  },
  {
    filePath: "sql/views/presta/cs_product_variants_br.sql",
    content: `-- staging das combinacoes e variantes de produtos
SELECT 
    pa.id_product_attribute AS id_variacao,
    pa.id_product AS id_produto,
    pa.reference AS referencia_variacao,
    pa.price AS acrescimo_preco,
    stock.quantity AS quantidade_estoque
FROM ps_product_attribute pa
LEFT JOIN ps_stock_available stock ON (pa.id_product_attribute = stock.id_product_attribute);`
  },
  {
    filePath: "sql/views/presta/vw_inventory_current.sql",
    content: `-- Relatorio analitico de estoque por fabricante para diretoria
SELECT 
    m.nome AS fabricante,
    p.nome_produto AS produto,
    SUM(v.quantidade_estoque) AS total_disponivel,
    SUM(v.quantidade_estoque * (p.preco_base + v.acrescimo_preco)) AS valor_total_estoque
FROM cs_manufacturer_br m
JOIN cs_products_br p ON m.id_fabricante = p.ativo
JOIN cs_product_variants_br v ON p.id_produto = v.id_produto
GROUP BY m.nome, p.nome_produto
ORDER BY valor_total_estoque DESC;`
  },
  {
    filePath: "sql/views/presta/tmp_test_view.sql",
    content: `-- View temporaria (violacao de regras de governanca)
SELECT * FROM ps_connections WHERE date_add > NOW() - INTERVAL 1 DAY;`
  }
];

export const DEVELOPMENT_GUIDE_STEPS: DevelopmentGuideStep[] = [
  {
    id: "step1",
    category: "linguagem",
    title: "1. Escolha de Linguagem e Runtime",
    subtitle: "Python (Recomendado) ou C# (.NET)",
    description: "Para um utilitário particular focado em automação de banco de dados e arquivos Git, Python é a escolha suprema devido à simplicidade ao manipular JSON e SQL, além da excelente portabilidade.",
    tips: [
      "Python 3.11+: Manipulação nativa de JSON, caminhos cruzados de arquivos mais eficientes.",
      "C# (.NET 8): Alternativa caso sua equipe trabalhe 100% no ecossistema Microsoft Windows.",
      "Vantagem do Python: O script de deploy das views (create_presta_views.py) pode ser o próprio core-engine executado no Terminal ou por baixo da tela visual."
    ],
    codeBlock: `dependencies = [
    "pymysql",       # Driver leve para conectar no MySQL/MariaDB do Prestashop
    "cryptography",  # Necessário para conexões seguras modernos
    "colorama"       # Logs coloridos no console do Windows
]`,
    codeLanguage: "python"
  },
  {
    id: "step2",
    category: "ambiente",
    title: "2. Ambiente de Desenvolvimento",
    subtitle: "Configurando a Workspace Local",
    description: "Configurar uma IDE que mostre em tempo real a hierarquia de pastas versionada no Git garante que os desenvolvedores nunca se percam de onde salvar seus arquivos de views.",
    tips: [
      "IDE Recomendada: VS Code (Visual Studio Code) ou PyCharm.",
      "Extensões cruciais: SQL Linter para auditar o código antes do deploy.",
      "Git instalado no Windows: Para garantir que as views salvas possam ser enviadas para revisão (Pull Requests)."
    ],
    codeBlock: `# Estrutura de Pastas Recomendada para o Projeto Windows
nexus-view-manager/
├── .env                  # Credenciais do Banco compiladas fora do código
├── .gitignore            # Ignorar credenciais locais (.env)
├── views_manifest.json   # O Manifesto controlador de views ativas
├── create_views.exe      # Executável compilado via PyInstaller
├── src/
│   ├── app.py            # Interface gráfica principal (PyQt/CustomTkinter)
│   └── database.py       # Gerenciador de conexão de banco de dados
└── sql/
    └── views/
        └── presta/
            ├── cs_manufacturer_br.sql
            └── cs_products_br.sql`,
    codeLanguage: "bash"
  },
  {
    id: "step3",
    category: "interface",
    title: "3. Interface Gráfica Windows",
    subtitle: "Visual Moderno com CustomTkinter ou PyQt6",
    description: "Para uma ferramenta particular elegante livre de dependências gigantescas de web, utilizamos o CustomTkinter - uma evolução moderna e escura (dark mode nativo) do próprio Tkinter do Python.",
    tips: [
      "No-Web-Bloat: Não precisa carregar 100MB de Chrome/Electron para uma ferramenta de uso privado.",
      "CustomTkinter: Widgets arredondados, paleta de cores moderna e totalmente responsivo para o Windows 10/11.",
      "Feedback instantâneo: Renderização da lista de views vindas do Manifesto com botão de deploy direto."
    ],
    codeBlock: `import customtkinter as ctk

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Nexus One - SQL View Controller")
        self.geometry("900x600")
        ctk.set_appearance_mode("dark")
        
        # Grid layout & Widgets
        self.title_label = ctk.CTkLabel(self, text="Gerenciador de Views SQL", font=("Segoe UI", 24, "bold"))
        self.title_label.pack(pady=20)
        
        # Botão para invocar o deployer sequencial
        self.btn_deploy = ctk.CTkButton(self, text="Executar Manifesto Git-First", command=self.deploy_manifest)
        self.btn_deploy.pack(pady=10)

    def deploy_manifest(self):
        # código para ler views_manifest.json e processar
        pass`,
    codeLanguage: "python"
  },
  {
    id: "step4",
    category: "arquitetura",
    title: "4. Regra de Negócio Git-First",
    subtitle: "O Manifesto views_manifest.json como Única Fonte da Verdade",
    description: "Você estabeleceu uma excelente barreira contra a bagunça! O seu aplicativo Windows lerá o JSON, inspecioná as pastas, lerá os arquivos .sql puros no diretório Git, e os aplicará no banco em lote ou unitário.",
    tips: [
      "Bloqueio de DB-Workbench: Proibir criações manuais cortando acesso de escrita de views direitinho.",
      "Consistência: O nome físico da View no banco de dados deve ser exatamente o 'view_name' listado no JSON.",
      "Versionamento: Se alterar uma View, altera-se o .sql e submete-se o commit. O manifesto garante repetições seguras."
    ],
    codeBlock: `[
  {
    "view_name": "cs_manufacturer_br",
    "database": "prestashop",
    "sql_file": "sql/views/presta/cs_manufacturer_br.sql",
    "owner": "fase_03",
    "purpose": "Normalizar fabricantes do Prestashop em pt-BR",
    "status": "active"
  }
]`,
    codeLanguage: "json"
  },
  {
    id: "step5",
    category: "git",
    title: "5. O Script Organizador (Backbone)",
    subtitle: "create_presta_views.py",
    description: "O código responsável por traduzir suas regras de governança para o servidor de banco de dados. Ele valida o padrão de nomes antes de enviar qualquer comando SQL CREATE ao banco.",
    tips: [
      "Validação regex: Garante que os nomes de views possuam prefixos 'cs_' ou 'vw_'.",
      "Bloqueio de 'tmp_': Lança alertas visuais vermelhos caso encontre arquivos contendo prefixos temporários ou nomes suspeitos.",
      "Execução Atômica: Se der erro, ele exibe no terminal do aplicativo exatamente o erro retornado pelo MySQL."
    ],
    codeBlock: `import json
import re
import os
import pymysql

# Regex de Nomes: cs_ ou vw_ obrigatório. Proíbe tmp_, backups e temporários teste/novo
PATTERN_VALID = re.compile(r'^(cs|vw)_[a-z0-9_]+$')
PATTERN_FORBIDDEN = re.compile(r'(tmp_|teste|novo|corrigido|backup|products_view_\\d+)')

def validate_view_name(name):
    if not PATTERN_VALID.match(name):
        return False, "Prefixo ou caracteres inválidos (Use cs_ ou vw_)."
    if PATTERN_FORBIDDEN.search(name):
        return False, "Nome contém termos proibidos (tmp, teste, novo, corrigido, backup)."
    return True, "Válido"

def run_deploy(config_db):
    print("--- INICIANDO DEPLOY DE VIEWS NEXUS ONE ---")
    
    with open("views_manifest.json", "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    conn = pymysql.connect(**config_db)
    cursor = conn.cursor()
    
    for item in manifest:
        v_name = item["view_name"]
        db = item["database"]
        f_path = item["sql_file"]
        status = item["status"]
        
        if status != "active":
            print(f"[PULADO] View {v_name} está inativa no manifesto.")
            continue
            
        # Validação de nome
        ok, msg = validate_view_name(v_name)
        if not ok:
            print(f"[REJEITADO] View {v_name} violou governança: {msg}")
            continue
            
        if not os.path.exists(f_path):
            print(f"[FALHA] Arquivo .sql não encontrado no Git: {f_path}")
            continue
            
        with open(f_path, "r", encoding="utf-8") as sql_f:
            sql_code = sql_f.read()
            
        # Comando atômico CREATE OR REPLACE VIEW
        # O script altera para o banco correto e executa
        cursor.execute(f"USE {db};")
        create_query = f"CREATE OR REPLACE VIEW {v_name} AS \\n{sql_code}"
        
        try:
            cursor.execute(create_query)
            print(f"[SUCESSO] View {v_name} implantada com êxito!")
        except Exception as e:
            print(f"[ERRO SQL] Falha imperdoável na view {v_name}: {e}")
            
    conn.commit()
    cursor.close()
    conn.close()`,
    codeLanguage: "python"
  },
  {
    id: "step6",
    category: "final",
    title: "6. Compilação Perfeita para Windows (.exe)",
    subtitle: "Resolvendo Dependências de Módulo no PyInstaller",
    description: "Você pode gerar um executável (.exe) de arquivo único para o Windows. Como o aplicativo 'app.py' importa funções de 'create_presta_views.py' no mesmo diretório ('src/'), a compilação deve ser feita de dentro da pasta 'src/' ou adicionando a pasta ao caminho de busca do PyInstaller para evitar o erro 'ModuleNotFoundError: No module named create_presta_views'.",
    tips: [
      "Navegar até a pasta src: Entre no diretório 'src' antes de rodar o PyInstaller para que os imports relativos funcionem na compilação nativa de forma limpa.",
      "Comando Prático: cd src && pyinstaller --noconsole --onefile app.py",
      "Alternativa sem mudar de pasta: Se quiser rodar na pasta raiz do projeto, utilize o parâmetro `--paths`: pyinstaller --noconsole --onefile --paths=src src/app.py",
      "Resultado: O app.exe compilado será gerado de forma autônoma na subpasta 'dist/' dentro de 'src/' (ou na raiz dependendo de onde o comando for executado) e já virá com toda a inteligência do validador empacotada!"
    ],
    codeBlock: `:: Abra o seu Terminal de Comandos (CMD / PowerShell) na pasta do projeto e digite:
pip install pyinstaller customtkinter pymysql

:: MÉTODO 1 (Recomendado - Entrando na pasta src):
cd src
pyinstaller --noconsole --onefile app.py

:: MÉTODO 2 (Direto da raiz usando --paths):
pyinstaller --noconsole --onefile --paths=src src/app.py`,
    codeLanguage: "bash"
  },
  {
    id: "step7",
    category: "final",
    title: "7. Criar Atalho Fácil no Windows",
    subtitle: "Facilitando o Acesso Direto para o Usuário Particular",
    description: "Para executar o aplicativo sem precisar abrir o terminal ou procurar a pasta de compilação, você pode criar um Atalho nativo (.lnk) ou um arquivo em lote (.bat) que pode ficar em sua Área de Trabalho.",
    tips: [
      "Localização do app.exe: Dependendo de onde rodou a compilação no Passo 6, o executável estará em 'dist/app.exe' (se rodou com --paths da raiz) ou em 'src/dist/app.exe' (se rodou 'cd src' antes).",
      "Atalho (.lnk): Clique com o botão direito na Área de Trabalho -> Novo -> Atalho, e aponte para o app.exe compilado.",
      "Comando Direto / Script Bat: Um arquivo .bat automatizado que entra na sua pasta de trabalho privada, sincroniza com o Git usando 'git pull' e executa o validador para implantar as views no banco.",
      "Vantagem: Rapidez e segurança total no fluxo."
    ],
    codeBlock: `:: Exemplo de arquivo "nexus_one_start.bat" para colocar na sua Área de Trabalho:
@echo off
cd /d "C:\\caminho\\para\\seu\\nexus-view-manager"

echo [GIT] Sincronizando repositorio Git...
git pull origin main

echo [LAUNCH] Inicializando Gerenciador e executando views_manifest.json...
:: Se rodou o PyInstaller de dentro da pasta 'src', mude para: "src\\dist\\app.exe"
start "" "dist\\app.exe"

exit`,
    codeLanguage: "bat"
  }
];
