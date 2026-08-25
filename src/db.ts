import Dexie, { type Table } from 'dexie';
import type { ProjectRecord, NodeRecord, EdgeRecord } from './types';

class MindmapDB extends Dexie {
  projects!: Table<ProjectRecord, string>;
  nodes!: Table<NodeRecord, string>;
  edges!: Table<EdgeRecord, string>;

  constructor() {
    super('mindmap-tool');
    this.version(1).stores({
      projects: 'id, updatedAt, syncCode',
      nodes: 'id, projectId',
      edges: 'id, projectId, source, target',
    });
  }
}

export const db = new MindmapDB();
