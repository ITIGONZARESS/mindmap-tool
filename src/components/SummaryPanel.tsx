import { useMemo, useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { buildFullOutline, buildOutlineFromOrigin } from '../utils/outline';

interface Props {
  onClose: () => void;
}

export default function SummaryPanel({ onClose }: Props) {
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const [mode, setMode] = useState<'origin' | 'full'>('origin');
  const [originId, setOriginId] = useState<string>(nodes[0]?.id ?? '');
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    if (mode === 'full') return buildFullOutline(nodes, edges);
    if (!originId) return '';
    return buildOutlineFromOrigin(nodes, edges, originId);
  }, [mode, originId, nodes, edges]);

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="summary-overlay" onClick={onClose}>
      <div className="summary-panel" onClick={(e) => e.stopPropagation()}>
        <div className="summary-header">
          <h3>まとめを出力</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="button-group">
          <button className={mode === 'origin' ? 'active' : ''} onClick={() => setMode('origin')}>
            起点選択モード
          </button>
          <button className={mode === 'full' ? 'active' : ''} onClick={() => setMode('full')}>
            全体出力モード
          </button>
        </div>

        {mode === 'origin' && (
          <div className="field-row">
            <label>起点ノード</label>
            <select value={originId} onChange={(e) => setOriginId(e.target.value)}>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.text || '（無題）'}
                </option>
              ))}
            </select>
          </div>
        )}

        <textarea className="summary-output" readOnly value={text} />

        <div className="summary-actions">
          <button className="primary" onClick={copy}>
            {copied ? 'コピーしました！' : 'クリップボードにコピー'}
          </button>
        </div>
      </div>
    </div>
  );
}
