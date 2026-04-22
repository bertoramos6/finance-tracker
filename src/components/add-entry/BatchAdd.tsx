import { useState, useEffect } from 'react';
import type { Transaction } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { useBatches, type BatchEntry } from '../../hooks/useBatches';

interface Props {
  userId: string;
  onAddBatch: (txns: Omit<Transaction, 'id' | 'created_at'>[]) => Promise<void>;
}

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'var(--input-bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 13px', color: 'var(--text)',
  fontSize: 14, fontFamily: 'Nunito, sans-serif', outline: 'none', ...extra,
});
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text2)',
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7, display: 'block',
};
const btn = (variant: 'primary' | 'ghost' | 'outline' | 'danger', extra: React.CSSProperties = {}): React.CSSProperties => {
  const base: React.CSSProperties = { border: 'none', cursor: 'pointer', borderRadius: 8, fontFamily: 'Nunito,sans-serif', fontWeight: 700, fontSize: 13, transition: 'all 0.13s', ...extra };
  if (variant === 'primary') return { ...base, background: 'var(--accent)', color: 'var(--accent-text)', padding: '9px 18px' };
  if (variant === 'ghost')   return { ...base, background: 'transparent', color: 'var(--text2)', padding: '7px 12px' };
  if (variant === 'danger')  return { ...base, background: 'transparent', color: 'var(--red)', padding: '7px 10px' };
  return { ...base, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 14px' };
};

export default function BatchAdd({ userId, onAddBatch }: Props) {
  const { batches, loading, createBatch, renameBatch, deleteBatch, addEntry, updateEntry, deleteEntry } = useBatches(userId);

  const [selectedId,  setSelectedId]  = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && batches.length > 0) setSelectedId(batches[0].id);
  }, [batches, selectedId]);
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [checked,     setChecked]     = useState<Record<string, boolean>>({});
  const [amounts,     setAmounts]     = useState<Record<string, string>>({});
  const [flash,       setFlash]       = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [managing,    setManaging]    = useState(false);

  // New batch form
  const [newBatchName, setNewBatchName] = useState('');
  // New entry form
  const [addingTo,    setAddingTo]   = useState<string | null>(null);
  const [newCat,      setNewCat]     = useState(CATEGORIES[0].name);
  const [newAmount,   setNewAmount]  = useState('');
  const [newDesc,     setNewDesc]    = useState('');
  // Rename
  const [renaming,    setRenaming]   = useState<string | null>(null);
  const [renameVal,   setRenameVal]  = useState('');

  const selected = batches.find(b => b.id === selectedId) ?? null;

  const isChecked = (e: BatchEntry) => checked[e.id] !== false; // default checked
  const getAmount = (e: BatchEntry) => amounts[e.id] ?? String(e.amount);

  const handleAddAll = async () => {
    if (!selected) return;
    const toAdd = selected.entries.filter(isChecked);
    if (!toAdd.length) return;
    setSubmitting(true);
    try {
      await onAddBatch(toAdd.map(e => ({
        type: 'expense' as const,
        amount: parseFloat(getAmount(e)) || e.amount,
        date,
        category: e.category,
        description: e.description,
      })));
      setFlash(true);
      setTimeout(() => setFlash(false), 1400);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCheck = (id: string) =>
    setChecked(p => ({ ...p, [id]: !isChecked({ id } as BatchEntry) }));

  const commitNewEntry = () => {
    if (!addingTo || !newAmount || isNaN(+newAmount)) return;
    addEntry(addingTo, { category: newCat, amount: +newAmount, description: newDesc });
    setNewAmount(''); setNewDesc(''); setNewCat(CATEGORIES[0].name); setAddingTo(null);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text2)', fontSize: 13 }}>Loading…</div>;

  if (batches.length === 0 && !managing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ fontSize: 32 }}>📦</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>No batches yet</div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Create a batch to add recurring expenses in one click</div>
        <button onClick={() => setManaging(true)} style={btn('primary', { fontSize: 14, padding: '11px 24px' })}>
          Create first batch
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box', maxWidth: 680, margin: '0 auto' }}>

      {/* ── Run section ─────────────────────────────── */}
      {!managing && selected && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', flex: 1 }}>Batch Add</h2>
            <button onClick={() => setManaging(true)} style={btn('ghost')}>Manage batches</button>
          </div>

          {/* Batch selector */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {batches.map(b => (
              <button key={b.id} onClick={() => { setSelectedId(b.id); setChecked({}); setAmounts({}); }}
                style={{
                  padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
                  fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700, transition: 'all 0.12s',
                  border: '1px solid var(--border)',
                  background: selectedId === b.id ? 'var(--accent)' : 'transparent',
                  color: selectedId === b.id ? 'var(--accent-text)' : 'var(--text2)',
                }}>
                {b.name}
              </button>
            ))}
          </div>

          {/* Date */}
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Date for all entries</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp({ width: 200 })} />
          </div>

          {/* Entries */}
          {selected.entries.length === 0 ? (
            <div style={{ color: 'var(--text2)', fontSize: 13, padding: '20px 0' }}>
              This batch has no entries yet. <button onClick={() => setManaging(true)} style={{ ...btn('ghost'), padding: '0 4px', fontSize: 13 }}>Add some →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {selected.entries.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: isChecked(e) ? 'var(--card)' : 'var(--surface-alt)',
                  border: `1px solid ${isChecked(e) ? 'var(--border)' : 'transparent'}`,
                  transition: 'all 0.12s', opacity: isChecked(e) ? 1 : 0.45,
                }}>
                  <input type="checkbox" checked={isChecked(e)} onChange={() => toggleCheck(e.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{e.category}</div>
                    {e.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{e.description}</div>}
                  </div>
                  <input
                    type="number" step="0.01"
                    value={getAmount(e)}
                    onChange={ev => setAmounts(p => ({ ...p, [e.id]: ev.target.value }))}
                    style={inp({ width: 100, textAlign: 'right', padding: '6px 10px', fontSize: 14, fontWeight: 700 })}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text2)', flexShrink: 0 }}>€</span>
                </div>
              ))}
            </div>
          )}

          {/* Total + Add button */}
          {selected.entries.length > 0 && (() => {
            const toAdd = selected.entries.filter(isChecked);
            const total = toAdd.reduce((s, e) => s + (parseFloat(getAmount(e)) || e.amount), 0);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{toAdd.length} entries · </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--red)' }}>€{total.toFixed(2)}</span>
                </div>
                <button onClick={handleAddAll} disabled={submitting || toAdd.length === 0} style={{
                  ...btn('primary', { fontSize: 14, padding: '11px 28px' }),
                  marginLeft: 'auto',
                  background: flash ? 'var(--green)' : 'var(--accent)',
                  color: flash ? '#fff' : 'var(--accent-text)',
                  opacity: toAdd.length === 0 ? 0.5 : 1,
                }}>
                  {flash ? `✓ Added ${toAdd.length} entries!` : `Add ${toAdd.length} entries`}
                </button>
              </div>
            );
          })()}
        </>
      )}

      {/* ── Manage section ───────────────────────────── */}
      {managing && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', flex: 1 }}>Manage Batches</h2>
            {batches.length > 0 && <button onClick={() => setManaging(false)} style={btn('ghost')}>← Back</button>}
          </div>

          {/* Create new batch */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              placeholder="New batch name…" value={newBatchName}
              onChange={e => setNewBatchName(e.target.value)}
              onKeyDown={async e => { if (e.key === 'Enter' && newBatchName.trim()) { const id = await createBatch(newBatchName.trim()); setSelectedId(id); setNewBatchName(''); setManaging(false); } }}
              style={inp({ flex: 1 })}
            />
            <button
              onClick={async () => { if (newBatchName.trim()) { const id = await createBatch(newBatchName.trim()); setSelectedId(id); setNewBatchName(''); setManaging(false); } }}
              style={btn('primary')}>
              Create
            </button>
          </div>

          {/* Batch list */}
          {batches.map(b => (
            <div key={b.id} style={{ marginBottom: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Batch header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: b.entries.length > 0 || addingTo === b.id ? '1px solid var(--border)' : 'none' }}>
                {renaming === b.id ? (
                  <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { renameBatch(b.id, renameVal); setRenaming(null); } if (e.key === 'Escape') setRenaming(null); }}
                    onBlur={() => { renameBatch(b.id, renameVal); setRenaming(null); }}
                    style={inp({ flex: 1, fontWeight: 800, fontSize: 15 })}
                  />
                ) : (
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', flex: 1 }}>{b.name}</span>
                )}
                <button onClick={() => { setRenaming(b.id); setRenameVal(b.name); }} style={btn('ghost', { padding: '5px 9px', fontSize: 12 })}>✎ Rename</button>
                <button onClick={() => { if (confirm(`Delete batch "${b.name}"?`)) { deleteBatch(b.id); if (selectedId === b.id) setSelectedId(batches.find(x => x.id !== b.id)?.id ?? null); } }} style={btn('danger', { padding: '5px 9px', fontSize: 12 })}>✕ Delete</button>
              </div>

              {/* Entries */}
              {b.entries.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{e.category}</span>
                    {e.description && <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 8 }}>{e.description}</span>}
                  </div>
                  <input
                    type="number" step="0.01" value={e.amount}
                    onChange={ev => updateEntry(b.id, e.id, { amount: +ev.target.value })}
                    style={inp({ width: 90, textAlign: 'right', padding: '5px 8px', fontSize: 13 })}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>€</span>
                  <button onClick={() => deleteEntry(b.id, e.id)} style={btn('danger', { padding: '4px 8px', fontSize: 12 })}>✕</button>
                </div>
              ))}

              {/* Add entry to this batch */}
              {addingTo === b.id ? (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select value={newCat} onChange={e => setNewCat(e.target.value)} style={inp({ flex: 1, minWidth: 160 })}>
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <input type="number" step="0.01" placeholder="Amount" value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      style={inp({ width: 110 })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Description (optional)" value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitNewEntry(); }}
                      style={inp({ flex: 1 })}
                    />
                    <button onClick={commitNewEntry} style={btn('primary')}>Add</button>
                    <button onClick={() => setAddingTo(null)} style={btn('ghost')}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingTo(b.id)} style={{
                  display: 'block', width: '100%', padding: '10px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', color: 'var(--text2)', fontSize: 13, fontWeight: 600,
                  fontFamily: 'Nunito,sans-serif', transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  + Add entry
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
