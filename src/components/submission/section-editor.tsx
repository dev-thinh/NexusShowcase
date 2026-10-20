'use client';

import { useDialog } from '@/components/dialog-provider';
import { useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, ImagePlus, Video, Link2, FileText, Type, Bold, Italic, List, Heading3, ChevronDown } from 'lucide-react';
import { uploadFileAction } from '@/actions/upload-actions';
import { ArticleBlockView } from '@/components/article-content';
import { articleFromLegacy, serializeArticle, type ArticleBlock, type ArticleSection } from '@/lib/article-content';
import type { SubmissionResource } from '@/lib/submission-types';

const control = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20';
const iconButton = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] disabled:opacity-30';
const newId = () => crypto.randomUUID();
const blockTypes = [{ kind: 'TEXT', icon: Type }, { kind: 'IMAGE', icon: ImagePlus }, { kind: 'VIDEO', icon: Video }, { kind: 'LINK', icon: Link2 }, { kind: 'DOCUMENT', icon: FileText }] as const;
const names = { TEXT: 'Văn bản', IMAGE: 'Ảnh / biểu đồ', VIDEO: 'Video', LINK: 'Liên kết', DOCUMENT: 'PDF' };

function TextBlockEditor({ block, onChange }: { block: Extract<ArticleBlock, { kind: 'TEXT' }>; onChange: (block: ArticleBlock) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const format = (prefix: string, suffix = '', line = false) => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart, end = input.selectionEnd;
    const selected = block.text.slice(start, end);
    const value = line ? selected.split('\n').map(text => prefix + text).join('\n') : prefix + (selected || 'nội dung') + suffix;
    onChange({ ...block, text: block.text.slice(0, start) + value + block.text.slice(end) });
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start, start + value.length); });
  };
  return <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1" aria-label="Định dạng văn bản">
      <button type="button" className={iconButton} aria-label="In đậm" title="In đậm" onClick={() => format('**', '**')}><Bold className="h-4 w-4" /></button>
      <button type="button" className={iconButton} aria-label="In nghiêng" title="In nghiêng" onClick={() => format('*', '*')}><Italic className="h-4 w-4" /></button>
      <button type="button" className={iconButton} aria-label="Tiêu đề phụ" title="Tiêu đề phụ" onClick={() => format('### ', '', true)}><Heading3 className="h-4 w-4" /></button>
      <button type="button" className={iconButton} aria-label="Danh sách" title="Danh sách" onClick={() => format('- ', '', true)}><List className="h-4 w-4" /></button>
      <span className="ml-2 text-xs text-slate-500">Định dạng văn bản</span>
    </div>
    <textarea ref={ref} aria-label="Nội dung văn bản" rows={7} value={block.text} onChange={e => onChange({ ...block, text: e.target.value })} placeholder="Viết nội dung của bạn…" className="block w-full resize-y px-4 py-3 text-sm leading-7 outline-none focus:ring-2 focus:ring-inset focus:ring-[#0F294A]/20" />
  </div>;
}

function BlockEditor({ block, onChange, onBusy }: { block: ArticleBlock; onChange: (block: ArticleBlock) => void; onBusy: (busy: boolean) => void }) {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  if (block.kind === 'TEXT') return <TextBlockEditor block={block} onChange={onChange} />;
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true); onBusy(true); setMessage('Đang tải lên…');
    try {
      const data = new FormData(); data.append('file', file); data.append('type', block.kind === 'IMAGE' ? 'thumbnail' : 'pdf');
      const result = await uploadFileAction(data);
      if (!result.success || !result.url) { setMessage(result.error || 'Không tải được tệp.'); return; }
      onChange({ ...block, url: result.url, fileName: result.fileName || file.name, fileSize: result.fileSize, mimeType: result.mimeType, alt: block.alt || (block.kind === 'IMAGE' ? file.name : '') });
      setMessage('Đã tải lên.');
    } catch { setMessage('Tải lên thất bại. Vui lòng thử lại.'); }
    finally { setUploading(false); onBusy(false); }
  };
  return <div className="space-y-3">
    {(block.kind === 'IMAGE' || block.kind === 'DOCUMENT') && <label className="block text-sm font-semibold text-slate-700">{block.kind === 'IMAGE' ? 'Tải ảnh JPEG, PNG, WebP (tối đa 5 MB)' : 'Tải PDF (tối đa 25 MB)'}<input type="file" disabled={uploading} accept={block.kind === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} onChange={e => void upload(e.target.files?.[0])} className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm" /></label>}
    <label className="block text-sm font-semibold text-slate-700">{block.kind === 'VIDEO' ? 'Liên kết YouTube, Loom hoặc Google Drive' : 'Liên kết'}<input type="url" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })} placeholder="https://…" className={`mt-2 ${control}`} /></label>
    <label className="block text-sm font-semibold text-slate-700">{block.kind === 'LINK' || block.kind === 'DOCUMENT' ? 'Tên hiển thị' : 'Chú thích'}<input value={block.caption} maxLength={160} onChange={e => onChange({ ...block, caption: e.target.value })} placeholder={block.kind === 'LINK' ? 'Ví dụ: Mã nguồn GitHub' : 'Mô tả ngắn nội dung minh họa…'} className={`mt-2 ${control}`} /></label>
    {block.kind === 'IMAGE' && <label className="block text-sm font-semibold text-slate-700">Mô tả ảnh <span className="text-rose-700">*</span><input value={block.alt} maxLength={500} onChange={e => onChange({ ...block, alt: e.target.value })} className={`mt-2 ${control}`} placeholder="Mô tả sơ đồ, biểu đồ hoặc hình ảnh cho người đọc" /></label>}
    {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
    {block.url && /^https?:\/\/|^\/uploads\//.test(block.url) && <div className="pt-2"><ArticleBlockView block={block} /></div>}
  </div>;
}

export function SectionEditor({ content, resources, onChange, onBusy }: { content: string; resources: SubmissionResource[]; onChange: (content: string) => void; onBusy: (busy: boolean) => void }) {
  const dialog = useDialog();
  const document = articleFromLegacy(content, resources);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const write = (sections: ArticleSection[]) => onChange(serializeArticle({ version: 1, sections }));
  const updateSection = (id: string, patch: Partial<ArticleSection>) => write(document.sections.map(section => section.id === id ? { ...section, ...patch } : section));
  const addSection = (title = '') => write([...document.sections, { id: newId(), title, blocks: [{ id: newId(), kind: 'TEXT', text: '' }] }]);
  const move = <T,>(items: T[], index: number, direction: number): T[] => {
    const copy = [...items]; [copy[index], copy[index + direction]] = [copy[index + direction], copy[index]]; return copy;
  };
  const addBlock = (section: ArticleSection, kind: ArticleBlock['kind']) => {
    const block: ArticleBlock = kind === 'TEXT' ? { id: newId(), kind, text: '' } : { id: newId(), kind, url: '', caption: '', alt: '' };
    updateSection(section.id, { blocks: [...section.blocks, block] });
  };
  return <div className="space-y-5">
    <div><h2 className="text-xl font-semibold text-slate-950">Nội dung chi tiết</h2><p className="mt-2 text-sm leading-6 text-slate-600">Thêm section và chèn nội dung theo thứ tự bạn muốn. Dự án có thể chỉ cần abstract.</p></div>
    {document.sections.map((section, index) => <section key={section.id} aria-label={`Section ${index + 1}`} className="relative space-y-4 before:pointer-events-none before:absolute before:inset-y-0 before:-left-3 before:w-0.5 before:rounded-full before:bg-[#0F294A]/30">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 sm:p-4">
        <span className="text-xs font-semibold text-[#0F294A]">{String(index + 1).padStart(2, '0')}</span>
        <input aria-label={`Tên section ${index + 1}`} value={section.title} maxLength={120} onChange={e => updateSection(section.id, { title: e.target.value })} placeholder="Đặt tên section…" className={`${control} min-w-0 flex-1 basis-40 font-semibold`} />
        <div className="ml-auto flex items-center [&>button]:text-slate-500 [&>button:hover]:bg-blue-100 [&>button:hover]:text-[#0F294A]">
          <button type="button" className={iconButton} disabled={index === 0} aria-label={`Đưa section ${index + 1} lên`} onClick={() => write(move(document.sections, index, -1))}><ArrowUp aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" className={iconButton} disabled={index === document.sections.length - 1} aria-label={`Đưa section ${index + 1} xuống`} onClick={() => write(move(document.sections, index, 1))}><ArrowDown aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" className={iconButton} aria-label={`Xóa section ${index + 1}`} onClick={async () => { if (await dialog.confirm({ title: 'Xóa section?', message: 'Toàn bộ nội dung trong section sẽ bị xóa.', confirmLabel: 'Xóa section', destructive: true })) write(document.sections.filter(s => s.id !== section.id)); }}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" className={iconButton} aria-expanded={!collapsed.includes(section.id)} aria-controls={`section-editor-${section.id}`} aria-label={`Thu gọn / mở section ${index + 1}`} onClick={() => setCollapsed(current => current.includes(section.id) ? current.filter(id => id !== section.id) : [...current, section.id])}><ChevronDown aria-hidden="true" className={`h-4 w-4 ${collapsed.includes(section.id) ? '-rotate-90' : ''}`} /></button>
        </div>
      </div>
      <div id={`section-editor-${section.id}`} hidden={collapsed.includes(section.id)}>
        <div className="divide-y-2 divide-slate-300">
          {section.blocks.map((block, blockIndex) => <div key={block.id} className="pb-4 pt-4 first:pt-0">
            <div className="mb-2 flex items-center justify-between gap-2"><p className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{names[block.kind]}</p><div className="flex">
              <button type="button" className={iconButton} disabled={blockIndex === 0} aria-label={`Đưa khối ${blockIndex + 1} lên`} onClick={() => updateSection(section.id, { blocks: move(section.blocks, blockIndex, -1) })}><ArrowUp aria-hidden="true" className="h-4 w-4" /></button>
              <button type="button" className={iconButton} disabled={blockIndex === section.blocks.length - 1} aria-label={`Đưa khối ${blockIndex + 1} xuống`} onClick={() => updateSection(section.id, { blocks: move(section.blocks, blockIndex, 1) })}><ArrowDown aria-hidden="true" className="h-4 w-4" /></button>
              <button type="button" className={iconButton} aria-label={`Xóa khối ${blockIndex + 1}`} onClick={async () => { if (await dialog.confirm({ title: 'Xóa khối nội dung?', message: 'Khối nội dung này sẽ bị xóa khỏi bài viết.', confirmLabel: 'Xóa nội dung', destructive: true })) updateSection(section.id, { blocks: section.blocks.filter(b => b.id !== block.id) }); }}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
            </div></div>
            <BlockEditor block={block} onBusy={onBusy} onChange={next => updateSection(section.id, { blocks: section.blocks.map(b => b.id === block.id ? next : b) })} />
          </div>)}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {blockTypes.map(({ kind, icon: Icon }) => <button key={kind} type="button" disabled={section.blocks.length >= 40} className="action-secondary-detail min-h-10 text-xs" onClick={() => addBlock(section, kind)}><Icon aria-hidden="true" className="h-4 w-4" />{names[kind]}</button>)}
        </div>
      </div>
    </section>)}
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4 sm:p-5">
      <button type="button" disabled={document.sections.length >= 30} onClick={() => addSection()} className="action-secondary-detail min-h-11 w-full"><Plus className="h-4 w-4" aria-hidden="true" />Thêm section</button>
      <div className="mt-3 flex flex-wrap gap-2"><span className="py-1 text-xs text-slate-500">Gợi ý:</span>{['Giới thiệu', 'Phương pháp', 'Thiết kế hệ thống', 'Thực nghiệm', 'Kết quả', 'Demo hoạt động', 'Kết luận'].map(title => <button key={title} type="button" disabled={document.sections.length >= 30} onClick={() => addSection(title)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:border-slate-400">{title}</button>)}</div>
    </div>
  </div>;
}
