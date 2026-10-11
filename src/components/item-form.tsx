'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createShowcaseItemAction, ContributorInput, LinkInput, AttachmentInput } from '@/actions/showcase-actions';
import { ItemType, ItemScope, ContributorRole, LinkType } from '@prisma/client';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  HelpCircle,
  Link2,
  CheckCircle2,
  Video,
  FileCheck,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

export function ItemForm({
  currentUserId,
  clubMembers,
}: {
  currentUserId: string;
  clubMembers: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ItemType>('RESEARCH_PAPER');
  const [scope, setScope] = useState<ItemScope>('EXTERNAL');
  const [issuer, setIssuer] = useState('');
  const [publishedYear, setPublishedYear] = useState(new Date().getFullYear());
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);

  // Tác giả
  const [contributors, setContributors] = useState<ContributorInput[]>([
    {
      userId: currentUserId,
      role: 'FIRST_AUTHOR',
      displayOrder: 1,
    },
  ]);

  // Links
  const [links, setLinks] = useState<LinkInput[]>([
    { label: 'Liên kết bài báo gốc (arXiv/IEEE)', url: '', type: 'PAPER_URL' },
    { label: 'Video Demo (YouTube/Loom)', url: '', type: 'VIDEO_EMBED' },
    { label: 'Mã nguồn GitHub', url: '', type: 'GITHUB' },
  ]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'thumbnail');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload ảnh thất bại');
      } else {
        setThumbnailUrl(data.url);
      }
    } catch {
      setError('Lỗi kết nối khi tải ảnh lên');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'pdf');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload tài liệu PDF thất bại');
      } else {
        setAttachments((prev) => [
          ...prev,
          {
            fileName: data.fileName || file.name,
            fileUrl: data.url,
            fileSize: data.fileSize || file.size,
            mimeType: data.mimeType || 'application/pdf',
          },
        ]);
      }
    } catch {
      setError('Lỗi kết nối khi tải tài liệu lên');
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addInternalMember = () => {
    setContributors([
      ...contributors,
      {
        userId: clubMembers[0]?.id || currentUserId,
        role: 'CO_AUTHOR',
        displayOrder: contributors.length + 1,
      },
    ]);
  };

  const addExternalAuthor = () => {
    setContributors([
      ...contributors,
      {
        externalName: '',
        externalAffiliation: 'Khoa CNTT - ĐHKHTN',
        role: 'ADVISOR',
        displayOrder: contributors.length + 1,
      },
    ]);
  };

  const removeContributor = (index: number) => {
    if (contributors.length <= 1) return;
    const next = contributors.filter((_, i) => i !== index);
    setContributors(next.map((c, i) => ({ ...c, displayOrder: i + 1 })));
  };

  const moveContributor = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= contributors.length) return;
    const next = [...contributors];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setContributors(next.map((c, i) => ({ ...c, displayOrder: i + 1 })));
  };

  const addLink = () => {
    setLinks([...links, { label: '', url: '', type: 'OTHER' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = async (submitForReview: boolean) => {
    if (!title.trim() || !summary.trim()) {
      setError('Vui lòng điền đầy đủ tiêu đề và tóm tắt bài viết');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createShowcaseItemAction(currentUserId, {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      type,
      scope,
      issuer: issuer.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      publishedYear,
      contributors,
      links: links.filter((l) => l.url.trim() !== ''),
      attachments,
      submitForReview,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Có lỗi xảy ra khi nộp bài');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <form className="space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm" onSubmit={(e) => e.preventDefault()}>
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Thông tin chung */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">1. Thông tin công trình & đề tài</h2>
          <Tooltip content="Điền thông tin chính xác theo bài báo đã xuất bản hoặc thông tin chính thức của đề tài" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tiêu đề bài viết / công trình *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            placeholder="Ví dụ: Ứng dụng học sâu trong phân đoạn ảnh y tế đa chiều..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phân loại *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="RESEARCH_PAPER">Bài báo khoa học</option>
              <option value="PROJECT">Dự án công nghệ</option>
              <option value="ACHIEVEMENT">Thành tích / Cống hiến</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phạm vi *
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ItemScope)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="EXTERNAL">Bên ngoài (NCKH, ICPC...)</option>
              <option value="INTERNAL">Nội bộ CLB</option>
              <option value="CLUB_CONTRIBUTION">Cống hiến xây dựng CLB</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Năm công bố / đạt giải *
            </label>
            <input
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Đơn vị công nhận / Đăng cai (Tùy chọn)
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Ví dụ: Hội nghị Khoa học Công nghệ Trẻ 2026, CLB Nexus, Khoa CNTT..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tóm tắt nội dung (Abstract) *
          </label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
            placeholder="Tóm tắt ngắn gọn mục tiêu, phương pháp, kết quả và ý nghĩa của công trình..."
          />
        </div>
      </section>

      {/* 2. Media & Thumbnail */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">2. Hình ảnh đại diện (Thumbnail)</h2>
          <Tooltip content="Hỗ trợ tải lên ảnh JPG, PNG, WebP tối đa 5MB. Ảnh sẽ được hiển thị trên thẻ bài đăng." />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
          <div className="w-40 h-24 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Upload className="w-4 h-4 text-blue-600" />}
              <span>{uploadingImage ? 'Đang tải ảnh...' : 'Chọn file ảnh từ máy'}</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2">Định dạng JPG, PNG, WebP (Tối đa 5MB)</p>
          </div>
        </div>
      </section>

      {/* 3. Tác giả & Đồng tác giả */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">3. Danh sách Tác giả & Giảng viên</h2>
            <Tooltip content="Thêm thành viên CLB để bài báo tự động xuất hiện trên profile của họ, hoặc thêm Thầy/Cô hướng dẫn ngoài không cần tài khoản." />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addInternalMember}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm thành viên CLB</span>
            </button>
            <button
              type="button"
              onClick={addExternalAuthor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Thầy/Cô hoặc tác giả ngoài</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {contributors.map((c, idx) => (
            <div
              key={idx}
              className="p-4 border border-slate-200/90 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-wrap items-center gap-3"
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-slate-400 w-5">#{idx + 1}</span>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveContributor(idx, 'up')}
                    className="p-0.5 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                    title="Đẩy lên trước"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === contributors.length - 1}
                    onClick={() => moveContributor(idx, 'down')}
                    className="p-0.5 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                    title="Đẩy xuống sau"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {c.userId !== undefined ? (
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={c.userId || ''}
                    onChange={(e) => {
                      const next = [...contributors];
                      next[idx].userId = e.target.value;
                      setContributors(next);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {clubMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex-1 min-w-[280px] grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Họ tên Thầy/Cô hoặc tác giả ngoài"
                    value={c.externalName || ''}
                    onChange={(e) => {
                      const next = [...contributors];
                      next[idx].externalName = e.target.value;
                      setContributors(next);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="Đơn vị công tác (Affiliation)"
                    value={c.externalAffiliation || ''}
                    onChange={(e) => {
                      const next = [...contributors];
                      next[idx].externalAffiliation = e.target.value;
                      setContributors(next);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div className="w-56">
                <select
                  value={c.role}
                  onChange={(e) => {
                    const next = [...contributors];
                    next[idx].role = e.target.value as ContributorRole;
                    setContributors(next);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ADVISOR">Người hướng dẫn / Giảng viên</option>
                  <option value="FIRST_AUTHOR">Tác giả chính (First Author)</option>
                  <option value="CO_FIRST_AUTHOR">Đồng tác giả 1</option>
                  <option value="CO_AUTHOR">Đồng tác giả (Co-Author)</option>
                  <option value="CORRESPONDING_AUTHOR">Tác giả liên hệ</option>
                  <option value="PROJECT_LEAD">Trưởng nhóm dự án</option>
                  <option value="CONTRIBUTOR">Thành viên tham gia</option>
                </select>
              </div>

              {contributors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContributor(idx)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa tác giả"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Liên kết liên quan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">4. Liên kết (arXiv, Video Demo, GitHub...)</h2>
            <Tooltip content="Hỗ trợ dán link Video YouTube/Loom để tự động nhúng player xem trực tiếp" />
          </div>
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm liên kết</span>
          </button>
        </div>

        <div className="space-y-3">
          {links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Tên nút (VD: Xem trên arXiv, Video Demo...)"
                value={link.label}
                onChange={(e) => {
                  const next = [...links];
                  next[idx].label = e.target.value;
                  setLinks(next);
                }}
                className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="url"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => {
                  const next = [...links];
                  next[idx].url = e.target.value;
                  setLinks(next);
                }}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => removeLink(idx)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Xóa link"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Tài liệu toàn văn & Phụ lục nghiên cứu (PDF) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">5. Tài liệu toàn văn & Phụ lục (PDF)</h2>
            <Tooltip content="Tải lên bản thảo bài báo (Paper manuscript), slide thuyết trình hoặc phụ lục kỹ thuật định dạng PDF (tối đa 25MB)" />
          </div>
          <button
            type="button"
            disabled={uploadingDoc}
            onClick={() => docInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0F294A] hover:bg-[#1A3E6B] text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{uploadingDoc ? 'Đang tải lên...' : 'Tải lên PDF'}</span>
          </button>
          <input
            ref={docInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDocUpload(file);
            }}
          />
        </div>

        {attachments.length === 0 ? (
          <div
            onClick={() => docInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-[#0F294A]/40 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
          >
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Chưa có tệp PDF nào được đính kèm</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Nhấp vào đây để tải lên bài báo toàn văn hoặc phụ lục nghiên cứu (PDF)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                    PDF
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{doc.fileName}</p>
                    <p className="text-[11px] text-slate-500">
                      {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB • {doc.mimeType}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa tệp đính kèm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Nội dung Markdown chi tiết */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">6. Nội dung chi tiết (Markdown)</h2>
          <Tooltip content="Hỗ trợ Markdown chuẩn: # Tiêu đề, danh sách, bảng, công thức, mã nguồn code block..." />
        </div>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mô tả phương pháp, kiến trúc, kết quả thử nghiệm chi tiết..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
        />
      </section>

      {/* Action Footer & Blocking Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu bản nháp (Draft)'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{loading ? 'Đang gửi duyệt...' : 'Gửi Thầy chủ nhiệm duyệt'}</span>
        </button>
      </div>
    </form>
  );
}
