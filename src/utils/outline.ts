import type { Edge, Node } from '@xyflow/react';
import type { MapEdgeData, MapNodeData } from '../types';

type FlowNode = Node<MapNodeData>;
type FlowEdge = Edge<MapEdgeData>;

function nodeLabel(node: FlowNode | undefined): string {
  if (!node) return '（不明なノード）';
  const text = node.data.text.trim();
  return text.length > 0 ? text : '（無題）';
}

function edgesFrom(edges: FlowEdge[], nodeId: string): FlowEdge[] {
  return edges.filter((e) => e.source === nodeId);
}

const MAX_LINES = 4000;

function walk(
  nodeId: string,
  depth: number,
  ancestors: Set<string>,
  nodesById: Map<string, FlowNode>,
  edges: FlowEdge[],
  lines: string[],
  touched: Set<string>,
): void {
  touched.add(nodeId);
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(nodeId);

  for (const edge of edgesFrom(edges, nodeId)) {
    if (lines.length > MAX_LINES) return;
    const targetLabel = nodeLabel(nodesById.get(edge.target));
    const question = edge.data?.question?.value ?? '';
    const arrow = question ? `→（${question}）→` : '→';
    const indent = '　'.repeat(depth + 1);
    lines.push(`${indent}${arrow}【${targetLabel}】`);
    touched.add(edge.target);

    // 同一ノードを2回以上通過する場合（自己ループ含む）はここで打ち切る
    if (ancestors.has(edge.target) || edge.target === nodeId) {
      continue;
    }
    walk(edge.target, depth + 1, nextAncestors, nodesById, edges, lines, touched);
  }
}

function outlineFrom(
  originId: string,
  nodesById: Map<string, FlowNode>,
  edges: FlowEdge[],
  touched: Set<string>,
): string {
  const lines: string[] = [`【${nodeLabel(nodesById.get(originId))}】`];
  touched.add(originId);
  walk(originId, 0, new Set([originId]), nodesById, edges, lines, touched);
  return lines.join('\n');
}

export function buildOutlineFromOrigin(nodes: FlowNode[], edges: FlowEdge[], originId: string): string {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  if (!nodesById.has(originId)) return '';
  const touched = new Set<string>();
  return outlineFrom(originId, nodesById, edges, touched);
}

export function buildFullOutline(nodes: FlowNode[], edges: FlowEdge[]): string {
  if (nodes.length === 0) return '';
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const incoming = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id);

  const touched = new Set<string>();
  const blocks: string[] = [];

  const runRoot = (id: string) => {
    if (touched.has(id)) return;
    blocks.push(outlineFrom(id, nodesById, edges, touched));
  };

  for (const rootId of roots) runRoot(rootId);

  // 全ノードが循環に含まれる等でルートが見つからない場合、残りを順に起点として出力する
  for (const node of nodes) {
    if (!touched.has(node.id)) runRoot(node.id);
  }

  return blocks.join('\n\n');
}
