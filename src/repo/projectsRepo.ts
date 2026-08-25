import { nanoid } from 'nanoid';
import { db } from '../db';
import { generateSyncCode, DEFAULT_NODE_STYLE } from '../constants';
import type { ProjectRecord, NodeRecord, EdgeRecord } from '../types';

export async function listProjects(): Promise<ProjectRecord[]> {
  const projects = await db.projects.toArray();
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return db.projects.get(id);
}

export async function findProjectBySyncCode(code: string): Promise<ProjectRecord | undefined> {
  return db.projects.where('syncCode').equals(code.toUpperCase()).first();
}

export async function createProject(title: string): Promise<ProjectRecord> {
  const now = Date.now();
  const project: ProjectRecord = {
    id: nanoid(),
    title: title || '無題のマインドマップ',
    syncCode: generateSyncCode(),
    createdAt: now,
    updatedAt: now,
    customQuestions: [],
  };
  await db.projects.add(project);

  const firstNode: NodeRecord = {
    id: nanoid(),
    projectId: project.id,
    x: 0,
    y: 0,
    text: '中心となるアイデア',
    style: { ...DEFAULT_NODE_STYLE },
    updatedAt: now,
  };
  await db.nodes.add(firstNode);

  return project;
}

export async function renameProject(id: string, title: string): Promise<void> {
  await db.projects.update(id, { title, updatedAt: Date.now() });
}

export async function touchProject(id: string): Promise<void> {
  await db.projects.update(id, { updatedAt: Date.now() });
}

export async function setCustomQuestions(id: string, customQuestions: string[]): Promise<void> {
  await db.projects.update(id, { customQuestions, updatedAt: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.nodes, db.edges, async () => {
    await db.nodes.where('projectId').equals(id).delete();
    await db.edges.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  });
}

export async function loadNodes(projectId: string): Promise<NodeRecord[]> {
  return db.nodes.where('projectId').equals(projectId).toArray();
}

export async function loadEdges(projectId: string): Promise<EdgeRecord[]> {
  return db.edges.where('projectId').equals(projectId).toArray();
}

export async function saveNodes(nodes: NodeRecord[]): Promise<void> {
  if (nodes.length === 0) return;
  await db.nodes.bulkPut(nodes);
}

export async function saveEdges(edges: EdgeRecord[]): Promise<void> {
  if (edges.length === 0) return;
  await db.edges.bulkPut(edges);
}

export async function deleteNodeRecords(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.nodes.bulkDelete(ids);
}

export async function deleteEdgeRecords(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.edges.bulkDelete(ids);
}
