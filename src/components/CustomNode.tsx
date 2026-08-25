import { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type Node } from '@xyflow/react';
import type { MapNodeData } from '../types';
import { useMapStore } from '../store/mapStore';

type MapNode = Node<MapNodeData>;

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left];

function shapeStyle(shape: MapNodeData['style']['shape']): React.CSSProperties {
  switch (shape) {
    case 'rectangle':
      return { borderRadius: 0 };
    case 'rounded':
      return { borderRadius: 14 };
    case 'ellipse':
      return { borderRadius: '50%' };
    case 'diamond':
      return { borderRadius: 0 };
    case 'none':
      return { borderRadius: 0, border: 'none', background: 'transparent' };
    default:
      return {};
  }
}

export default function CustomNode({ id, data, selected }: NodeProps<MapNode>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeText = useMapStore((s) => s.updateNodeText);
  const { style } = data;

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(data.text);
  }, [data.text]);

  const commit = () => {
    setEditing(false);
    if (draft !== data.text) updateNodeText(id, draft);
  };

  const isNone = style.shape === 'none';
  const isDiamond = style.shape === 'diamond';

  const boxStyle: React.CSSProperties = {
    width: style.autoResize ? 'auto' : style.width,
    height: style.autoResize ? 'auto' : style.height,
    minWidth: 60,
    minHeight: 32,
    background: isNone ? 'transparent' : style.fillColor,
    border: isNone ? 'none' : `${style.borderWidth}px solid ${style.borderColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isNone ? 4 : '10px 14px',
    boxSizing: 'border-box',
    ...shapeStyle(style.shape),
  };

  const textStyle: React.CSSProperties = {
    fontSize: style.fontSize,
    fontWeight: style.bold ? 700 : 400,
    color: style.textColor,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: 'center',
    width: '100%',
  };

  const content = editing ? (
    <textarea
      ref={textareaRef}
      className="node-textarea"
      value={draft}
      style={{ ...textStyle, background: 'transparent', border: 'none', outline: 'none', resize: 'none' }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setDraft(data.text);
          setEditing(false);
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          commit();
        }
        e.stopPropagation();
      }}
    />
  ) : (
    <div style={textStyle}>{data.text || '（テキストなし）'}</div>
  );

  return (
    <div
      className={`map-node${selected ? ' selected' : ''}`}
      onDoubleClick={() => setEditing(true)}
      style={isDiamond ? { width: boxStyle.width, height: boxStyle.height } : undefined}
    >
      {!style.autoResize && (
        <NodeResizer
          isVisible={selected}
          minWidth={60}
          minHeight={32}
          onResizeEnd={(_, params) => {
            useMapStore.getState().updateNodeStyle(id, { width: params.width, height: params.height });
          }}
        />
      )}
      {isDiamond ? (
        <div className="diamond-wrap" style={boxStyle}>
          <div className="diamond-content" style={textStyle}>
            {content}
          </div>
        </div>
      ) : (
        <div style={boxStyle}>{content}</div>
      )}
      {HANDLE_POSITIONS.map((pos) => (
        <Handle key={pos} id={pos} type="source" position={pos} className="map-handle" />
      ))}
    </div>
  );
}
