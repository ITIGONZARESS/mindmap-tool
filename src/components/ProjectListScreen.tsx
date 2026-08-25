import { useEffect, useState } from 'react';
import type { ProjectRecord } from '../types';
import { listProjects, createProject, renameProject, deleteProject, findProjectBySyncCode } from '../repo/projectsRepo';

interface Props {
  onOpen: (id: string) => void;
}

export default function ProjectListScreen({ onOpen }: Props) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [syncError, setSyncError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setProjects(await listProjects());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    const project = await createProject('無題のマインドマップ');
    onOpen(project.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このマインドマップを削除します。よろしいですか？')) return;
    await deleteProject(id);
    refresh();
  };

  const handleRenameCommit = async (id: string) => {
    if (renameDraft.trim()) {
      await renameProject(id, renameDraft.trim());
    }
    setRenamingId(null);
    refresh();
  };

  const handleOpenByCode = async () => {
    setSyncError('');
    const code = syncCodeInput.trim();
    if (!code) return;
    const project = await findProjectBySyncCode(code);
    if (!project) {
      setSyncError('該当するプロジェクトが見つかりませんでした。');
      return;
    }
    onOpen(project.id);
  };

  return (
    <div className="project-list-screen">
      <div className="project-list-header">
        <h1>マインドマップツール</h1>
        <p className="subtitle">ゲームシナリオ企画用マインドマップ作成ツール</p>
      </div>

      <div className="project-list-actions">
        <button className="primary" onClick={handleCreate}>
          ＋ 新規作成
        </button>
        <div className="sync-open-row">
          <input
            placeholder="同期コードで開く"
            value={syncCodeInput}
            onChange={(e) => setSyncCodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleOpenByCode()}
          />
          <button onClick={handleOpenByCode}>開く</button>
        </div>
      </div>
      {syncError && <p className="error-text">{syncError}</p>}

      {loading ? (
        <p>読み込み中…</p>
      ) : projects.length === 0 ? (
        <p className="hint">まだプロジェクトがありません。「新規作成」から始めましょう。</p>
      ) : (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id} className="project-card">
              <div className="project-card-main" onClick={() => onOpen(p.id)}>
                {renamingId === p.id ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={() => handleRenameCommit(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameCommit(p.id)}
                  />
                ) : (
                  <span className="project-name">{p.title}</span>
                )}
                <span className="project-meta">
                  更新: {new Date(p.updatedAt).toLocaleString('ja-JP')} / コード: {p.syncCode}
                </span>
              </div>
              <div className="project-card-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(p.id);
                    setRenameDraft(p.title);
                  }}
                >
                  名前変更
                </button>
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
