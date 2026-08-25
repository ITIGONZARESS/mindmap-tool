import { useState } from 'react';
import { useMapStore } from '../store/mapStore';

interface Props {
  onBack: () => void;
  onOpenSummary: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
}

export default function Header({ onBack, onOpenSummary, onExportPng, onExportSvg }: Props) {
  const project = useMapStore((s) => s.project);
  const saveStatus = useMapStore((s) => s.saveStatus);
  const setProjectTitle = useMapStore((s) => s.setProjectTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project?.title ?? '');
  const [codeCopied, setCodeCopied] = useState(false);

  if (!project) return null;

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== project.title) {
      setProjectTitle(titleDraft.trim());
    } else {
      setTitleDraft(project.title);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(project.syncCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  return (
    <header className="app-header">
      <button className="back-btn" onClick={onBack}>
        ← 一覧へ
      </button>

      {editingTitle ? (
        <input
          className="title-input"
          autoFocus
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
        />
      ) : (
        <h2 className="project-title" onClick={() => setEditingTitle(true)} title="クリックして名前を変更">
          {project.title}
        </h2>
      )}

      <div className="sync-code" title="同期コード（同一デバイス内の識別用。複数端末同期は今後のFirebase連携で対応予定）">
        コード: <code>{project.syncCode}</code>
        <button onClick={copyCode}>{codeCopied ? 'コピー済' : 'コピー'}</button>
      </div>

      <div className="save-status">
        {saveStatus === 'saving' ? '保存中…' : '保存済み'}
      </div>

      <div className="header-actions">
        <button onClick={onExportPng}>PNG書き出し</button>
        <button onClick={onExportSvg}>SVG書き出し</button>
        <button className="primary" onClick={onOpenSummary}>
          まとめを出力
        </button>
      </div>
    </header>
  );
}
