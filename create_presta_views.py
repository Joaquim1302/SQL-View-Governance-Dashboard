import os
import re
import json
import pymysql

# Padrão de Expressão Regular de Segurança do Nexus One
PATTERN_VALID = re.compile(r'^(cs|vw)_[a-z0-9_]+$')
PATTERN_FORBIDDEN = re.compile(r'(tmp_|teste|novo|corrigido|backup|products_view_\d+)', re.IGNORECASE)

def validate_view_name(name: str):
    """
    Valida se o nome da view obedece rigorosamente às regras de governança.
    """
    if not name:
        return False, "Nome vazio."
    if not PATTERN_VALID.match(name):
        return False, "Nome não segue a regra de prefixos obrigatórios (deve iniciar com 'cs_' ou 'vw_')."
    if PATTERN_FORBIDDEN.search(name):
        return False, "Contém termos proibidos pela governança (tmp_, teste, novo, corrigido, backup)."
    return True, "Válido"

def run_presta_views_deploy(config_db, log_callback=print):
    """
    Filtra as views do views_manifest.json, lê os arquivos .sql do repositório Git
    e aplica-os atômica e sequencialmente no banco de dados.
    """
    manifest_path = "views_manifest.json"
    
    if not os.path.exists(manifest_path):
        log_callback(f"[FALHA] Arquivo {manifest_path} não foi localizado.")
        return False
        
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception as e:
        log_callback(f"[ERRO] Falha ao parsear o views_manifest.json: {e}")
        return False

    log_callback("🚀 [NEXUS COMPILER] Iniciando validação e deploy em lote...")
    success_count = 0
    skipped_count = 0
    error_count = 0

    # Abre conexao com o banco de dados
    try:
        conn = pymysql.connect(**config_db)
        cursor = conn.cursor()
    except Exception as e:
        log_callback(f"❌ [DB CONNECTION ERROR] Falha ao conectar ao servidor MySQL: {e}")
        return False

    for item in manifest:
        v_name = item.get("view_name", "")
        db_name = item.get("database", "prestashop")
        sql_file_path = item.get("sql_file", "")
        status = item.get("status", "inactive")
        
        log_callback("-" * 50)
        log_callback(f"Verificando View: {v_name}")

        # Regra 1: Status ativo
        if status != "active":
            log_callback(f"⚠️ [PULADO] View '{v_name}' está definida como '{status}' no manifesto.")
            skipped_count += 1
            continue

        # Regra 2: Padrão estrito de nomenclatura
        val_ok, val_msg = validate_view_name(v_name)
        if not val_ok:
            log_callback(f"❌ [REJEITADO] View '{v_name}' violou governança de nomes: {val_msg}")
            error_count += 1
            continue

        # Regra 3: Arquivo SQL físico correspondente no Git
        if not os.path.exists(sql_file_path):
            log_callback(f"❌ [FALHA] Arquivo físico não encontrado: {sql_file_path}")
            error_count += 1
            continue

        # Ler conteúdo SQL
        try:
            with open(sql_file_path, "r", encoding="utf-8") as sf:
                sql_content = sf.read().strip()
        except Exception as e:
            log_callback(f"❌ [LEITURA] Erro ao ler {sql_file_path}: {e}")
            error_count += 1
            continue

        # Execução SQL
        try:
            # Alternar para o banco do manifesto
            cursor.execute(f"USE `{db_name}`;")
            # Rodar consulta atômica
            full_query = f"CREATE OR REPLACE VIEW `{v_name}` AS \n{sql_content}"
            cursor.execute(full_query)
            log_callback(f"✨ [SUCESSO] View '{v_name}' implantada com êxito!")
            success_count += 1
        except Exception as e:
            log_callback(f"❌ [ERRO SQL] Falha na compilação da view '{v_name}': {e}")
            error_count += 1

    # Fecha recursos com segurança
    try:
        conn.commit()
        cursor.close()
        conn.close()
    except Exception:
        pass

    log_callback("=" * 50)
    log_callback("🏁 [SUMÁRIO DO DEPLOY]")
    log_callback(f"   - Views implantadas/atualizadas: {success_count}")
    log_callback(f"   - Ignoradas ou Inativas: {skipped_count}")
    log_callback(f"   - Rejeitadas ou com Erro SQL: {error_count}")
    
    return error_count == 0

if __name__ == "__main__":
    # Exemplo de execução isolada via terminal
    db_test = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "port": 3306,
        "charset": "utf8mb4"
    }
    print("Executando script de deploy em modo terminal (standalone)...")
    run_presta_views_deploy(db_test)
