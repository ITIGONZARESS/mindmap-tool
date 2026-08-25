import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  MarkerType,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import type { MapEdgeData } from '../types';
import { useMapStore } from '../store/mapStore';
import QuestionPicker from './QuestionPicker';

type MapEdge = Edge<MapEdgeData>;

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<MapEdge>) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const setSelectedEdge = useMapStore((s) => s.setSelectedEdge);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const style = data?.style ?? { color: '#666666', thickness: 2, direction: 'one-way' as const };
  const question = data?.question ?? null;

  const marker = { type: MarkerType.ArrowClosed, color: style.color, width: 18, height: 18 };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#arrow-end-${id})`}
        markerStart={style.direction === 'two-way' ? `url(#arrow-start-${id})` : undefined}
        style={{ stroke: style.color, strokeWidth: style.thickness }}
      />
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id={`arrow-end-${id}`}
            markerWidth={marker.width}
            markerHeight={marker.height}
            refX="8"
            refY="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={style.color} />
          </marker>
          {style.direction === 'two-way' && (
            <marker
              id={`arrow-start-${id}`}
              markerWidth={marker.width}
              markerHeight={marker.height}
              refX="2"
              refY="5"
              orient="auto-start-reverse"
            >
              <path d="M10,0 L0,5 L10,10 z" fill={style.color} />
            </marker>
          )}
        </defs>
      </svg>
      <EdgeLabelRenderer>
        <div
          className={`edge-question-label${selected ? ' selected' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEdge(id);
            setPickerOpen((v) => !v);
          }}
        >
          <span className="q-icon">❓</span>
          <span className="q-text">{question?.value ?? '問いを設定'}</span>
        </div>
        {pickerOpen && (
          <div
            className="question-picker-popover"
            style={{
              position: 'absolute',
              transform: `translate(-50%, 12px) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <QuestionPicker edgeId={id} onClose={() => setPickerOpen(false)} />
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
