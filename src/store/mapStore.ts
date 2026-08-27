import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import type { MapNodeData, MapEdgeData, ProjectRecord, EdgeQuestion } from '../types';
import { DEFAULT_NODE_STYLE, DEFAULT_EDGE_STYLE } from '../constants';
import {
  getProject,
  loadNodes,
  loadEdges,
  saveNodes,
  saveEdges,
  deleteNodeRecords,
  deleteEdgeRecords,
  setCustomQuestions,
  renameProject as renameProjectRepo,
} from '../repo/projectsRepo';

type FlowNode = Node<MapNodeData>;
type FlowEdge = Edge<MapEdgeData>;

export type SaveStatus = 'idle' | 'saving' | 'saved';

interface DirtyState {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  deletedNodeIds: Set<string>;
  deletedEdgeIds: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
}

const dirty: DirtyState = {
  nodeIds: new Set(),
  edgeIds: new Set(),
  deletedNodeIds: new Set(),
  deletedEdgeIds: new Set(),
  timer: null,
};

function resetDirty() {
  if (dirty.timer) clearTimeout(dirty.timer);
  dirty.timer = null;
  dirty.nodeIds.clear();
  dirty.edgeIds.clear();
  dirty.deletedNodeIds.clear();
  dirty.deletedEdgeIds.clear();
}

interface MapState {
  projectId: string | null;
  project: ProjectRecord | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  saveStatus: SaveStatus;
  loading: boolean;

  loadProject: (id: string) => Promise<void>;
  clearProject: () => void;
  setProjectTitle: (title: string) => Promise<void>;

  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (position: { x: number; y: number }) => void;
  updateNodeText: (id: string, text: string) => void;
  updateNodeStyle: (id: string, partial: Partial<MapNodeData['style']>) => void;
  deleteNode: (id: string) => void;

  updateEdgeStyle: (id: string, partial: Partial<MapEdgeData['style']>) => void;
  updateEdgeQuestion: (id: string, question: EdgeQuestion | null) => void;
  deleteEdge: (id: string) => void;

  addCustomQuestion: (text: string) => Promise<void>;

  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
}

function scheduleSave(get: () => MapState, set: (partial: Partial<MapState>) => void) {
  set({ saveStatus: 'saving' });
  if (dirty.timer) clearTimeout(dirty.timer);
  dirty.timer = setTimeout(async () => {
    const state = get();
    const projectId = state.projectId;
    if (!projectId) return;

    const nodesToSave = state.nodes
      .filter((n) => dirty.nodeIds.has(n.id))
      .map((n) => ({
        id: n.id,
        projectId,
        x: n.position.x,
        y: n.position.y,
        text: n.data.text,
        style: n.data.style,
        updatedAt: Date.now(),
      }));
    const edgesToSave = state.edges
      .filter((e) => dirty.edgeIds.has(e.id))
      .map((e) => ({
        id: e.id,
        projectId,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
        style: e.data!.style,
        question: e.data!.question,
        updatedAt: Date.now(),
      }));

    await Promise.all([
      saveNodes(nodesToSave),
      saveEdges(edgesToSave),
      deleteNodeRecords(Array.from(dirty.deletedNodeIds)),
      deleteEdgeRecords(Array.from(dirty.deletedEdgeIds)),
    ]);

    dirty.nodeIds.clear();
    dirty.edgeIds.clear();
    dirty.deletedNodeIds.clear();
    dirty.deletedEdgeIds.clear();
    dirty.timer = null;
    set({ saveStatus: 'saved' });
  }, 500);
}

export const useMapStore = create<MapState>((set, get) => ({
  projectId: null,
  project: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  saveStatus: 'idle',
  loading: false,

  loadProject: async (id) => {
    resetDirty();
    set({ loading: true, projectId: id, nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null });
    const [project, nodeRecords, edgeRecords] = await Promise.all([
      getProject(id),
      loadNodes(id),
      loadEdges(id),
    ]);
    if (!project) {
      set({ loading: false });
      return;
    }
    const nodes: FlowNode[] = nodeRecords.map((n) => ({
      id: n.id,
      type: 'mapNode',
      position: { x: n.x, y: n.y },
      data: { text: n.text, style: n.style },
    }));
    const edges: FlowEdge[] = edgeRecords.map((e) => ({
      id: e.id,
      type: 'question',
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      data: { style: e.style, question: e.question },
    }));
    set({ project, nodes, edges, loading: false, saveStatus: 'saved' });
  },

  clearProject: () => {
    resetDirty();
    set({ projectId: null, project: null, nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null });
  },

  setProjectTitle: async (title) => {
    const { projectId, project } = get();
    if (!projectId || !project) return;
    await renameProjectRepo(projectId, title);
    set({ project: { ...project, title } });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    let needsSave = false;
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        dirty.nodeIds.add(change.id);
        needsSave = true;
      } else if (change.type === 'remove') {
        dirty.deletedNodeIds.add(change.id);
        dirty.nodeIds.delete(change.id);
        needsSave = true;
      } else if (change.type === 'dimensions') {
        dirty.nodeIds.add(change.id);
        needsSave = true;
      }
    }
    if (needsSave) scheduleSave(get, set);
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    let needsSave = false;
    for (const change of changes) {
      if (change.type === 'remove') {
        dirty.deletedEdgeIds.add(change.id);
        dirty.edgeIds.delete(change.id);
        needsSave = true;
      }
    }
    if (needsSave) scheduleSave(get, set);
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    const id = nanoid();
    const newEdge: FlowEdge = {
      id,
      type: 'question',
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      data: { style: { ...DEFAULT_EDGE_STYLE }, question: null },
    };
    set({ edges: [...get().edges, newEdge] });
    dirty.edgeIds.add(id);
    scheduleSave(get, set);
  },

  addNode: (position) => {
    const id = nanoid();
    const newNode: FlowNode = {
      id,
      type: 'mapNode',
      position,
      data: { text: '新しいアイデア', style: { ...DEFAULT_NODE_STYLE } },
    };
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id, selectedEdgeId: null });
    dirty.nodeIds.add(id);
    scheduleSave(get, set);
  },

  updateNodeText: (id, text) => {
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text } } : n)),
    });
    dirty.nodeIds.add(id);
    scheduleSave(get, set);
  },

  updateNodeStyle: (id, partial) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, style: { ...n.data.style, ...partial } } } : n,
      ),
    });
    dirty.nodeIds.add(id);
    scheduleSave(get, set);
  },

  deleteNode: (id) => {
    const removedEdgeIds = get()
      .edges.filter((e) => e.source === id || e.target === id)
      .map((e) => e.id);
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: null,
    });
    dirty.deletedNodeIds.add(id);
    dirty.nodeIds.delete(id);
    for (const edgeId of removedEdgeIds) {
      dirty.deletedEdgeIds.add(edgeId);
      dirty.edgeIds.delete(edgeId);
    }
    scheduleSave(get, set);
  },

  updateEdgeStyle: (id, partial) => {
    set({
      edges: get().edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data!, style: { ...e.data!.style, ...partial } } } : e,
      ),
    });
    dirty.edgeIds.add(id);
    scheduleSave(get, set);
  },

  updateEdgeQuestion: (id, question) => {
    set({
      edges: get().edges.map((e) => (e.id === id ? { ...e, data: { ...e.data!, question } } : e)),
    });
    dirty.edgeIds.add(id);
    scheduleSave(get, set);
  },

  deleteEdge: (id) => {
    set({ edges: get().edges.filter((e) => e.id !== id), selectedEdgeId: null });
    dirty.deletedEdgeIds.add(id);
    dirty.edgeIds.delete(id);
    scheduleSave(get, set);
  },

  addCustomQuestion: async (text) => {
    const { projectId, project } = get();
    const trimmed = text.trim();
    if (!projectId || !project || !trimmed) return;
    if (project.customQuestions.includes(trimmed)) return;
    const customQuestions = [...project.customQuestions, trimmed];
    await setCustomQuestions(projectId, customQuestions);
    set({ project: { ...project, customQuestions } });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: id ? null : get().selectedEdgeId }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: id ? null : get().selectedNodeId }),
}));
