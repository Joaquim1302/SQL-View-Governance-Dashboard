import os
import json
import customtkinter as ctk
from create_nexus_views import validate_view_name, run_nexus_views_deploy

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class NexusOneApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Configurações de Janela do Windows
        self.title("Nexus One | SQL View Controller & Governance")
        self.geometry("1024x720")
        self.minsize(950, 650)

        # Variáveis de Estado locais
        self.selected_view_index = None
        self.manifest_data = []
        self.load_manifest()

        # Layout Split: Sidebar (Menu lateral) e Content Area (Painel principal)
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)

        # ------------------ SIDEBAR EXPLORER ------------------
        self.sidebar_frame = ctk.CTkFrame(self, width=240, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(5, weight=1)

        self.logo_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="NEXUS ONE", 
            font=ctk.CTkFont(family="Segoe UI", size=18, weight="bold")
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.subtitle_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="Git & View Governor", 
            font=ctk.CTkFont(family="Segoe UI", size=10, slant="italic")
        )
        self.subtitle_label.grid(row=1, column=0, padx=20, pady=(0, 20))

        # Regras Rápidas de Suffixos
        self.rules_frame = ctk.CTkFrame(self.sidebar_frame)
        self.rules_frame.grid(row=2, column=0, padx=15, pady=10, sticky="ew")
        
        rules_title = ctk.CTkLabel(self.rules_frame, text="REGRAS DE NOMENCLATURA", font=ctk.CTkFont(size=9, weight="bold"))
        rules_title.pack(pady=5)
        
        rule_cs = ctk.CTkLabel(self.sidebar_frame, text="• cs_ : Camada Staging (Válido)", text_color="#10B981", font=ctk.CTkFont(size=10))
        rule_cs.grid(row=3, column=0, padx=15, pady=2, sticky="w")
        
        rule_vw = ctk.CTkLabel(self.sidebar_frame, text="• vw_ : View Analítica (Válido)", text_color="#3B82F6", font=ctk.CTkFont(size=10))
        rule_vw.grid(row=4, column=0, padx=15, pady=2, sticky="w")

        rule_tmp = ctk.CTkLabel(self.sidebar_frame, text="• tmp_ / teste_ : Proibido", text_color="#EF4444", font=ctk.CTkFont(size=10, weight="bold"))
        rule_tmp.grid(row=5, column=0, padx=15, pady=(2, 20), sticky="nw")

        # Botão rápido para recarregar o manifesto
        self.btn_refresh = ctk.CTkButton(
            self.sidebar_frame, 
            text="Recarregar Manifesto", 
            command=self.load_manifest
        )
        self.btn_refresh.grid(row=6, column=0, padx=15, pady=10, sticky="ew")

        # ------------------ MAIN CONTAINER ------------------
        self.main_container = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        self.main_container.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        self.main_container.grid_columnconfigure(0, weight=1)
        self.main_container.grid_rowconfigure(2, weight=1) # Editor de código estica

        # Top Header Area
        self.header_frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.header_frame.grid(row=0, column=0, sticky="ew", pady=(0, 15))
        self.header_frame.grid_columnconfigure(0, weight=1)

        self.title_label = ctk.CTkLabel(
            self.header_frame, 
            text="Gerenciador de SQL Views", 
            font=ctk.CTkFont(family="Segoe UI", size=24, weight="bold")
        )
        self.title_label.grid(row=0, column=0, sticky="w")
        
        self.desc_label = ctk.CTkLabel(
            self.header_frame, 
            text="Controle robusto integrado ao arquivo Git local: sql/views/create_nexus_views_manifests.json", 
            text_color="#94A3B8"
        )
        self.desc_label.grid(row=1, column=0, sticky="w")

        # Botão de ação Principal (Deploy)
        self.btn_deploy = ctk.CTkButton(
            self.header_frame, 
            text="⚡ Executar Deploy das Views", 
            fg_color="#4F46E5", 
            hover_color="#4338CA",
            font=ctk.CTkFont(weight="bold"),
            command=self.execute_deploy_sim
        )
        self.btn_deploy.grid(row=0, column=1, rowspan=2, padx=10, sticky="e")

        # Seletor de Views do Manifesto
        self.combo_frame = ctk.CTkFrame(self.main_container)
        self.combo_frame.grid(row=1, column=0, sticky="ew", pady=10, padx=5)
        
        self.combo_label = ctk.CTkLabel(self.combo_frame, text="Selecione uma View para visualizar no Git:")
        self.combo_label.pack(side="left", padx=10, pady=10)

        self.view_selector = ctk.CTkOptionMenu(
            self.combo_frame, 
            values=["Nenhuma view carregada"],
            command=self.on_view_selected
        )
        self.view_selector.pack(side="left", fill="x", expand=True, padx=10, pady=10)

        # Editor de Código SQL (CustomTkinter TextBox)
        self.code_label = ctk.CTkLabel(self.main_container, text="Script SQL Local (.sql):", font=ctk.CTkFont(weight="bold"))
        self.code_label.grid(row=2, column=0, sticky="w", padx=5)

        self.code_editor = ctk.CTkTextbox(self.main_container, font=("Consolas", 12))
        self.code_editor.grid(row=3, column=0, sticky="nsew", pady=(5, 15), padx=5)
        self.code_editor.insert("0.0", "-- Selecione uma view do Manifesto para editar o script SQL associado.")

        # Terminal de Saída (Logs)
        self.log_label = ctk.CTkLabel(self.main_container, text="Terminal de Execução (Console):", font=ctk.CTkFont(weight="bold"))
        self.log_label.grid(row=4, column=0, sticky="w", padx=5)

        self.terminal_output = ctk.CTkTextbox(self.main_container, height=140, font=("Consolas", 10), fg_color="#020617", text_color="#10B981")
        self.terminal_output.grid(row=5, column=0, sticky="ew", padx=5)
        self.terminal_output.insert("0.0", "[INFO] Terminal ativo. Aguardando execução do manifesto...\n")

        # Inicializa o combo
        self.populate_dropdown()

    def add_log(self, text: str):
        self.terminal_output.insert("end", f"{text}\n")
        self.terminal_output.see("end")

    def load_manifest(self):
        manifest_path = "create_nexus_views_manifests.json"
        if not os.path.exists(manifest_path):
            # Cria um manifesto inicial padrão se não existir na máquina do usuário particular
            default_manifest = [
                {
                    "view_name": "cs_manufacturer_br",
                    "database": "nexus",
                    "sql_file": "sql/views/nexus/cs_manufacturer_br.sql",
                    "owner": "fase_03",
                    "purpose": "Normalizar fabricantes do Nexus em pt-BR",
                    "status": "active"
                }
            ]
            os.makedirs("sql/views/nexus", exist_ok=True)
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(default_manifest, f, indent=2, ensure_ascii=False)
            
            # Cria a SQL inicial de exemplo
            sql_file = "sql/views/nexus/cs_manufacturer_br.sql"
            if not os.path.exists(sql_file):
                with open(sql_file, "w", encoding="utf-8") as sf:
                    sf.write("SELECT id_manufacturer, name FROM ps_manufacturer WHERE active = 1;")

        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                self.manifest_data = json.load(f)
        except Exception as e:
            self.manifest_data = []

    def populate_dropdown(self):
        if self.manifest_data:
            names = [item["view_name"] for item in self.manifest_data]
            self.view_selector.configure(values=names)
            self.view_selector.set(names[0])
            self.on_view_selected(names[0])
        else:
            self.view_selector.configure(values=["Sem views"])
            self.view_selector.set("Sem views")

    def on_view_selected(self, view_name: str):
        # Localiza o registro correspondente
        for entry in self.manifest_data:
            if entry["view_name"] == view_name:
                sql_path = entry["sql_file"]
                self.code_editor.delete("0.0", "end")
                
                # Regra: Se o arquivo existir no Git, lê o sql
                if os.path.exists(sql_path):
                    try:
                        with open(sql_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        self.code_editor.insert("0.0", content)
                    except Exception as e:
                        self.code_editor.insert("0.0", f"-- Erro ao ler arquivo do Git: {e}")
                else:
                    self.code_editor.insert("0.0", f"-- [ALERTA] Arquivo não encontrado no caminho do manifesto:\n-- {sql_path}")
                break

    def execute_deploy_sim(self):
        self.terminal_output.delete("0.0", "end")
        self.add_log("[NEXUS CONTROL] Conectando ao Banco de Dados local simulado...")
        
        # Configuração de banco para seu ambiente local (atualizar conforme necessidade)
        db_config = {
            "host": "127.0.0.1",
            "user": "root",
            "password": "",
            "port": 3306,
            "charset": "utf8mb4"
        }
        
        # Chama a engine real importada de create_nexus_views.py passando os logs para o nosso aplicativo desktop
        try:
            run_nexus_views_deploy(db_config, log_callback=self.add_log)
        except Exception as e:
            self.add_log(f"❌ [ERRO CRÍTICO] Falha catastrófica ao tentar executar o deployer: {e}")

if __name__ == "__main__":
    app = NexusOneApp()
    app.mainloop()
