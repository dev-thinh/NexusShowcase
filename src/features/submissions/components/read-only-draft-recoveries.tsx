'use client';
import { useI18n } from '@/shared/i18n/provider';


import { useEffect, useState } from 'react';
import { listRecoveries, removeRecovery, type DraftRecovery } from './draft-recovery';
import { DraftRecoveryPanel } from './draft-recovery-panel';

/** Even after submission, the owner can retrieve unsynced text from another tab. */
export function ReadOnlyDraftRecoveries({ accountId, itemId, serverVersion }: { accountId: string; itemId: string; serverVersion: number }) {
  const { t: tr } = useI18n();

  const [records, setRecords] = useState<DraftRecovery[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    try { const result = listRecoveries(window.localStorage, accountId, itemId); setRecords(result.records); setError(result.error); }
    catch { setError(true); }
  }, [accountId, itemId]);
  return <>
    {error && <p role="status">{tr("Không đọc được bản khôi phục trên thiết bị này.")}</p>}
    <DraftRecoveryPanel records={records} serverVersion={serverVersion} onDiscard={record => {
      try { if (removeRecovery(window.localStorage, record)) setRecords(current => current.filter(entry => entry.sessionId !== record.sessionId)); else setError(true); }
      catch { setError(true); }
    }} />
    {!records.length && !error && <p className="mt-4 text-sm">{tr("Không có bản khôi phục chưa đồng bộ trên thiết bị này.")}</p>}
  </>;
}
