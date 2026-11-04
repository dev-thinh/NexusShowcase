import type { ShowcaseDraftInput } from '../model/input';
import type { SaveDraftInput } from '../model/versioned-input';
import type { ActionResult } from '@/shared/lib/action-result';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'conflict';
type Receipt = { id: string; slug: string; status: string; reviewVersion: number };
type PendingMutation = { input: SaveDraftInput; editSequence: number };
export type SaveSnapshot = {
  data: ShowcaseDraftInput; reviewVersion: number; editSequence: number; isDirty: boolean;
  status: SaveState; error: string | null; locallySaved: boolean; pendingMutation?: PendingMutation;
};
type Options = {
  itemId: string; reviewVersion: number; data: ShowcaseDraftInput;
  save: (input: SaveDraftInput) => Promise<ActionResult<Receipt>>;
  persist: (snapshot: SaveSnapshot) => boolean;
  onChange: (snapshot: SaveSnapshot) => void;
};

/** One writer per editor; immutable requests and their IDs survive uncertain retries. */
export class DraftSaveCoordinator {
  snapshot: SaveSnapshot;
  private pending?: PendingMutation;
  private running?: Promise<(Receipt & { editSequence: number }) | null>;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private maxTimer?: ReturnType<typeof setTimeout>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private failures = 0;
  private disposed = false;
  private blocked = false;
  private online = true;

  constructor(private readonly options: Options) {
    this.snapshot = { data: options.data, reviewVersion: options.reviewVersion, editSequence: 0, isDirty: false, status: 'saved', error: null, locallySaved: true };
  }
  private emit(persist = true) {
    this.snapshot = { ...this.snapshot, pendingMutation: this.pending };
    if (persist) this.snapshot.locallySaved = this.options.persist(this.snapshot);
    this.options.onChange({ ...this.snapshot });
  }
  update(data: ShowcaseDraftInput) {
    if (this.disposed) return;
    this.snapshot = { ...this.snapshot, data: structuredClone(data), editSequence: this.snapshot.editSequence + 1, isDirty: true,
      status: this.blocked ? 'conflict' : this.online ? (this.running ? 'saving' : 'idle') : 'offline', error: this.blocked ? this.snapshot.error : null };
    this.emit();
    this.schedule();
  }
  restore(data: ShowcaseDraftInput, version: number, editSequence: number, pending?: PendingMutation) {
    this.pending = pending;
    this.snapshot = { ...this.snapshot, data, reviewVersion: version, editSequence, isDirty: true, status: 'idle' };
    this.emit(); this.schedule();
  }
  setOnline(online: boolean) {
    this.online = online;
    if (!online && this.snapshot.isDirty) { this.snapshot.status = 'offline'; this.emit(); }
    if (online && this.snapshot.isDirty && !this.blocked) void this.retry();
  }
  private schedule() {
    if (this.disposed || this.blocked || !this.online || this.retryTimer || this.running) return;
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => void this.flush(), 1500);
    this.maxTimer ??= setTimeout(() => void this.flush(), 10000);
  }
  flush(): Promise<(Receipt & { editSequence: number }) | null> {
    if (this.running) return this.running;
    if (this.disposed || this.blocked || !this.online) return Promise.resolve(null);
    clearTimeout(this.idleTimer); clearTimeout(this.maxTimer); this.maxTimer = undefined;
    this.running = this.drain().finally(() => { this.running = undefined; });
    return this.running;
  }
  private async drain(): Promise<(Receipt & { editSequence: number }) | null> {
    let last = { id: this.options.itemId, slug: '', status: 'DRAFT', reviewVersion: this.snapshot.reviewVersion, editSequence: this.snapshot.editSequence };
    while (this.snapshot.isDirty && !this.disposed && this.online) {
      this.pending ??= { input: { itemId: this.options.itemId, expectedReviewVersion: this.snapshot.reviewVersion, mutationId: crypto.randomUUID(), draft: structuredClone(this.snapshot.data) }, editSequence: this.snapshot.editSequence };
      const pending = this.pending;
      this.snapshot.status = 'saving'; this.snapshot.error = null; this.emit();
      let result: ActionResult<Receipt>;
      try { result = await this.options.save(pending.input); }
      catch { result = { success: false, code: 'INTERNAL', error: 'Không kết nối được máy chủ. Nội dung chưa đồng bộ.' }; }
      if (this.disposed) return null; // Leave the durable request available for receipt replay.
      if (!result.success) {
        this.blocked = !['INTERNAL', 'RATE_LIMITED', 'VALIDATION'].includes(result.code);
        if (result.code === 'VALIDATION') this.pending = undefined;
        this.snapshot.status = this.blocked ? 'conflict' : this.online ? 'error' : 'offline';
        this.snapshot.error = result.error; this.emit();
        if (!this.blocked && this.online && result.code !== 'VALIDATION') {
          const delay = Math.min(30000, 2000 * 2 ** this.failures++);
          this.retryTimer = setTimeout(() => { this.retryTimer = undefined; void this.flush(); }, delay);
        }
        return null;
      }
      this.failures = 0; this.pending = undefined;
      last = { ...result.data, editSequence: pending.editSequence };
      this.snapshot.reviewVersion = result.data.reviewVersion;
      this.snapshot.isDirty = this.snapshot.editSequence !== pending.editSequence;
      this.snapshot.status = this.snapshot.isDirty ? (this.online ? 'idle' : 'offline') : 'saved';
      this.snapshot.error = null; this.emit();
    }
    return last;
  }
  retry() {
    clearTimeout(this.retryTimer); this.retryTimer = undefined;
    return this.flush();
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.idleTimer); clearTimeout(this.maxTimer); clearTimeout(this.retryTimer);
  }
}
