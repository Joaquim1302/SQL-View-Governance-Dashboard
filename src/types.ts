export interface SQLViewEntry {
  view_name: string;
  database: string;
  sql_file: string;
  owner: string;
  purpose: string;
  status: 'active' | 'inactive';
}

export interface SqlFile {
  filePath: string;
  content: string;
}

export interface DevelopmentGuideStep {
  id: string;
  category: 'arquitetura' | 'linguagem' | 'ambiente' | 'interface' | 'git' | 'final';
  title: string;
  subtitle: string;
  description: string;
  tips: string[];
  codeBlock?: string;
  codeLanguage?: string;
}
