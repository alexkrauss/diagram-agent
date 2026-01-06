import basics from './basics.md?raw';
import shapes from './shapes.md?raw';
import connections from './connections.md?raw';
import containers from './containers.md?raw';
import styles from './styles.md?raw';
import sequenceDiagrams from './sequence-diagrams.md?raw';
import sqlTables from './sql-tables.md?raw';
import umlClasses from './uml-classes.md?raw';

const contextDocs = {
  basics,
  shapes,
  connections,
  containers,
  styles,
  'sequence-diagrams': sequenceDiagrams,
  'sql-tables': sqlTables,
  'uml-classes': umlClasses,
} as const;

const aliasMap: Record<string, keyof typeof contextDocs> = {
  base: 'basics',
  basics: 'basics',
  intro: 'basics',
  start: 'basics',
  shape: 'shapes',
  shapes: 'shapes',
  connection: 'connections',
  connections: 'connections',
  edge: 'connections',
  edges: 'connections',
  container: 'containers',
  containers: 'containers',
  nesting: 'containers',
  style: 'styles',
  styles: 'styles',
  styling: 'styles',
  sequence: 'sequence-diagrams',
  'sequence-diagram': 'sequence-diagrams',
  'sequence-diagrams': 'sequence-diagrams',
  sequence_diagram: 'sequence-diagrams',
  sequences: 'sequence-diagrams',
  sql: 'sql-tables',
  sql_table: 'sql-tables',
  'sql-table': 'sql-tables',
  'sql-tables': 'sql-tables',
  tables: 'sql-tables',
  uml: 'uml-classes',
  class: 'uml-classes',
  classes: 'uml-classes',
  'uml-class': 'uml-classes',
  'uml-classes': 'uml-classes',
};

function normalizeKeyword(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getContextDoc(keyword: string): string | null {
  const normalized = normalizeKeyword(keyword);
  const alias = aliasMap[normalized] ?? aliasMap[normalized.replace(/-/g, '')];
  if (alias) {
    return contextDocs[alias];
  }
  if (normalized in contextDocs) {
    return contextDocs[normalized as keyof typeof contextDocs];
  }
  return null;
}

export function getContextKeywords(): string[] {
  return Object.keys(contextDocs);
}
