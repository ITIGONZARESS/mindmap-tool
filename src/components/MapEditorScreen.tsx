import { useEffect, useState, useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, ConnectionMode, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMapStore } from '../store/mapStore';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import Sidebar from './Sidebar';
import Header from './Header';
import SummaryPanel from './SummaryPanel';
import { exportPng, exportSvg } from '../utils/export';

const nodeTypes = { mapNode: CustomNode };
const edgeTypes = { question: CustomEdge };

interface Props {
  projectId: string;
  onBack: () => void;
}

export default function MapEditorScreen({ projectId, onBack }: Props) {
  const loadProject = useMapStore((s) => s.loadProject);
  const clearProject = useMapStore((s) => s.clearProject);
  const loading = useMapStore((s) => s.loading);
  const project = useMapStore((s) => s.project);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const onNodesChange = useMapStore((s) => s.onNodesChange);
  const onEdgesChange = useMapStore((s) => s.onEdgesChange);
  const onConnect = useMapStore((s) => s.onConnect);
  const setSelectedNode = useMapStore((s) => s.setSelectedNode);
  const setSelectedEdge = useMapStore((s) => s.setSelectedEdge);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    loadProject(projectId);
    return () => clearProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: { id: string }[] }) => {
      if (selNodes.length === 1) setSelectedNode(selNodes[0].id);
      else if (selEdges.length === 1) setSelectedEdge(selEdges[0].id);
      else {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    },
    [setSelectedNode, setSelectedEdge],
  );

  const plainNodes = useMemo(() => nodes, [nodes]);

  if (loading || !project) {
    return <div className="loading-screen">読み込み中…</div>;
  }

  return (
    <div className="editor-screen">
      <Header
        onBack={onBack}
        onOpenSummary={() => setSummaryOpen(true)}
        onExportPng={() => exportPng(plainNodes, project.title)}
        onExportSvg={() => exportSvg(plainNodes, project.title)}
      />
      <div className="editor-body">
        <Sidebar />
        <div className="canvas-wrap">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            connectionMode={ConnectionMode.Loose}
            fitView
            minZoom={0.1}
            maxZoom={2.5}
          >
            <Background gap={20} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
      </div>
      {summaryOpen && <SummaryPanel onClose={() => setSummaryOpen(false)} />}
    </div>
  );
}
