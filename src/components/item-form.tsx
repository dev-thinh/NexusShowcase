'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createShowcaseItemAction, ContributorInput, LinkInput, AttachmentInput } from '@/actions/showcase-actions';
import { uploadFileAction } from '@/actions/upload-actions';
import { ItemType, ItemScope, ContributorRole } from '@prisma/client';
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
  CheckCircle2,
  Link2,
  X,
  ExternalLink,
  Users,
  Building2,
  BookOpen,
} from 'lucide-react';

export function ItemForm({
  currentUserId,
  currentUserRole,
  clubMembers,
}: {
  currentUserId: string;
  currentUserRole?: string;
  clubMembers: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'url'>('upload');

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [showDirectDocInput, setShowDirectDocInput] = useState(false);
  const [directDocName, setDirectDocName] = useState('');
  const [directDocUrl, setDirectDocUrl] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ItemType>('RESEARCH_PAPER');
  const [scope, setScope] = useState<ItemScope>('EXTERNAL');
  const [issuer, setIssuer] = useState('');
  const [publishedYear, setPublishedYear] = useState(new Date().getFullYear());
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);

  // Tác giả & Giảng viên
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

  // Upload Ảnh
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    setImageError(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'thumbnail');

    try {
      const res = await uploadFileAction(formData);
      if (!res.success) {
        setImageError(res.error || 'Upload ảnh thất bại.');
      } else if (res.url) {
        setThumbnailUrl(res.url);
      }
    } catch {
      setImageError('Lỗi kết nối khi tải ảnh lên.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Upload PDF
  const handleDocUpload = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    setDocError(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'pdf');

    try {
      const res = await uploadFileAction(formData);
      if (!res.success) {
        setDocError(res.error || 'Upload tài liệu PDF thất bại.');
      } else if (res.url) {
        setAttachments((prev) => [
          ...prev,
          {
            fileName: res.fileName || file.name,
            fileUrl: res.url!,
            fileSize: res.fileSize || file.size,
            mimeType: res.mimeType || 'application/pdf',
          },
        ]);
      }
    } catch {
      setDocError('Lỗi kết nối khi tải tài liệu lên.');
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) {
        docInputRef.current.value = '';
      }
    }
  };

  // Thêm PDF trực tiếp qua URL
  const handleAddDirectDoc = () => {
    if (!directDocUrl.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        fileName: directDocName.trim() || 'Tai-lieu-nghien-cuu.pdf',
        fileUrl: directDocUrl.trim(),
        fileSize: 0,
        mimeType: 'application/pdf',
      },
    ]);
    setDirectDocName('');
    setDirectDocUrl('');
    setShowDirectDocInput(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Tác giả handlers
  const addContributor = () => {
    setContributors((prev) => [
      ...prev,
      {
        userId: clubMembers[0]?.id || currentUserId,
        role: 'CO_AUTHOR',
        displayOrder: prev.length + 1,
      },
    ]);
  };

  const toggleContributorType = (idx: number, isInternal: boolean) => {
    setContributors((prev) => {
      const next = [...prev];
      if (isInternal) {
        next[idx] = {
          ...next[idx],
          userId: clubMembers[0]?.id || currentUserId,
          externalName: null,
          externalAffiliation: null,
        };
      } else {
        next[idx] = {
          ...next[idx],
          userId: null,
          externalName: '',
          externalAffiliation: 'Khoa CNTT - ĐHKHTN',
        };
      }
      return next;
    });
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

  // Links handlers
  const addLink = () => {
    setLinks([...links, { label: '', url: '', type: 'OTHER' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // Submit handler
  const handleSubmit = async (submitForReview: boolean) => {
    if (!title.trim() || !summary.trim()) {
      setError('Vui lòng điền đầy đủ tiêu đề và tóm tắt công trình nghiên cứu.');
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
      setError(result.error || 'Có lỗi xảy ra khi nộp bài.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const isAdmin = currentUserRole === 'ADMIN';

  return (
    <form className="space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs" onSubmit={(e) => e.preventDefault()}>
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* 1. Thông tin chung */}
      <section className="space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">1. Thông tin công trình</h2>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tiêu đề bài viết / công trình *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-colors"
            placeholder="Ví dụ: Ứng dụng học sâu trong phân đoạn ảnh y tế..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phân loại *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A] font-medium"
            >
              <option value="RESEARCH_PAPER">Bài báo khoa học</option>
              <option value="PROJECT">Dự án công nghệ</option>
              <option value="ACHIEVEMENT">Thành tích / Cống hiến</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phạm vi *
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ItemScope)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A] font-medium"
            >
              <option value="EXTERNAL">Bên ngoài (NCKH, ICPC...)</option>
              <option value="INTERNAL">Nội bộ CLB</option>
              <option value="CLUB_CONTRIBUTION">Cống hiến xây dựng CLB</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
              Năm công bố *
            </label>
            <input
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A] font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
            Đơn vị công nhận / Đăng cai (Tùy chọn)
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
            placeholder="Ví dụ: Hội nghị Khoa học Trẻ 2026, CLB Nexus, Khoa CNTT..."
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tóm tắt nội dung (Abstract) *
          </label>
          <textarea
            required
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A] leading-relaxed"
            placeholder="Tóm tắt mục tiêu, phương pháp, kết quả và ý nghĩa của công trình..."
          />
        </div>
      </section>

      {/* 2. Hình ảnh đại diện (Thumbnail) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">2. Hình ảnh đại diện (Thumbnail)</h2>

          {/* Toggle Upload vs URL */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setThumbnailMode('upload')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                thumbnailMode === 'upload'
                  ? 'bg-[#0F294A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tải tệp từ máy
            </button>
            <button
              type="button"
              onClick={() => setThumbnailMode('url')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                thumbnailMode === 'url'
                  ? 'bg-[#0F294A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nhập link URL
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-48 h-32 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 relative group">
              {thumbnailUrl ? (
                <>
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-[11px] font-semibold">Chưa có ảnh</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full text-center sm:text-left">
              {thumbnailMode === 'upload' ? (
                <div className="space-y-3">
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
                  <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#0F294A] text-slate-800 text-sm font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-[#0F294A]" /> : <Upload className="w-4 h-4 text-[#0F294A]" />}
                      <span>{uploadingImage ? 'Đang tải ảnh...' : 'Chọn file ảnh từ máy'}</span>
                    </button>
                    {thumbnailUrl && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã tải ảnh lên thành công
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Hỗ trợ JPG, PNG, WebP (Tối đa 5MB)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Đường dẫn hình ảnh trực tiếp (Image URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://example.com/images/paper-thumbnail.png"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                    />
                    {thumbnailUrl && (
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              )}

              {imageError && (
                <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {imageError}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Danh sách Tác giả & Giảng viên */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">3. Danh sách Tác giả &amp; Giảng viên</h2>
            <p className="text-xs text-slate-500 mt-0.5">Xếp theo thứ tự xuất bản học thuật. Có thể chọn thành viên CLB hoặc nhập tác giả ngoài.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {contributors.length} tác giả
          </span>
        </div>

        <div className="space-y-3">
          {contributors.map((c, idx) => {
            const isInternal = Boolean(c.userId);
            return (
              <div
                key={idx}
                className="p-4 sm:p-5 border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-[#0F294A] text-white">
                      #{idx + 1}
                    </span>

                    {/* Toggle internal vs external */}
                    <div className="inline-flex rounded-lg p-0.5 bg-white border border-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleContributorType(idx, true)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                          isInternal
                            ? 'bg-[#0F294A] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Thành viên CLB
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleContributorType(idx, false)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                          !isInternal
                            ? 'bg-[#0F294A] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tác giả ngoài / Giảng viên
                      </button>
                    </div>
                  </div>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveContributor(idx, 'up')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F294A] hover:bg-slate-200/60 disabled:opacity-30 cursor-pointer"
                      title="Đẩy lên trước"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === contributors.length - 1}
                      onClick={() => moveContributor(idx, 'down')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F294A] hover:bg-slate-200/60 disabled:opacity-30 cursor-pointer"
                      title="Đẩy xuống sau"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    {contributors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContributor(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                        title="Xóa tác giả này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Author Info Input Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  {isInternal ? (
                    <div className="lg:col-span-7">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Chọn thành viên trong CLB
                      </label>
                      <select
                        value={c.userId || ''}
                        onChange={(e) => {
                          const next = [...contributors];
                          next[idx].userId = e.target.value;
                          setContributors(next);
                        }}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                      >
                        {clubMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="lg:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Họ và tên tác giả *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: TS. Nguyễn Văn A..."
                          value={c.externalName || ''}
                          onChange={(e) => {
                            const next = [...contributors];
                            next[idx].externalName = e.target.value;
                            setContributors(next);
                          }}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Đơn vị công tác
                        </label>
                        <input
                          type="text"
                          placeholder="Khoa CNTT - ĐHKHTN"
                          value={c.externalAffiliation || ''}
                          onChange={(e) => {
                            const next = [...contributors];
                            next[idx].externalAffiliation = e.target.value;
                            setContributors(next);
                          }}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                        />
                      </div>
                    </>
                  )}

                  <div className="lg:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Vai trò học thuật
                    </label>
                    <select
                      value={c.role}
                      onChange={(e) => {
                        const next = [...contributors];
                        next[idx].role = e.target.value as ContributorRole;
                        setContributors(next);
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white font-bold text-[#0F294A] focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                    >
                      <option value="FIRST_AUTHOR">Tác giả chính (First Author)</option>
                      <option value="CO_FIRST_AUTHOR">Đồng tác giả 1</option>
                      <option value="CO_AUTHOR">Đồng tác giả (Co-Author)</option>
                      <option value="ADVISOR">Người hướng dẫn / Giảng viên (Advisor)</option>
                      <option value="PROJECT_LEAD">Trưởng nhóm dự án (Project Lead)</option>
                      <option value="CORRESPONDING_AUTHOR">Tác giả liên hệ</option>
                      <option value="CONTRIBUTOR">Thành viên tham gia (Contributor)</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Add Contributor Button */}
        <button
          type="button"
          onClick={addContributor}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0F294A] text-slate-700 hover:text-[#0F294A] hover:bg-slate-50 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#0F294A]" />
          <span>Thêm tác giả / thành viên tham gia</span>
        </button>
      </section>

      {/* 4. Liên kết liên quan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">4. Liên kết (arXiv, Video, GitHub...)</h2>
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer border border-slate-200"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm liên kết</span>
          </button>
        </div>

        <div className="space-y-3">
          {links.map((link, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Tên nút (VD: Xem trên arXiv...)"
                value={link.label}
                onChange={(e) => {
                  const next = [...links];
                  next[idx].label = e.target.value;
                  setLinks(next);
                }}
                className="w-full sm:w-1/3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
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
                className="w-full sm:flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
              />
              <button
                type="button"
                onClick={() => removeLink(idx)}
                className="self-end sm:self-center p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">5. Tài liệu toàn văn &amp; Phụ lục (PDF)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tải lên file PDF từ máy hoặc dán link tài liệu trực tiếp.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploadingDoc}
              onClick={() => docInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm bg-[#0F294A] hover:bg-[#1A3E6B] text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{uploadingDoc ? 'Đang tải lên...' : 'Tải lên PDF'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDirectDocInput((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <Link2 className="w-4 h-4" />
              <span>Dán link PDF</span>
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
        </div>

        {/* Direct PDF Link Drawer */}
        {showDirectDocInput && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F294A] uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#0F294A]" />
                Thêm tài liệu PDF qua đường dẫn trực tiếp (arXiv / Cloud)
              </span>
              <button
                type="button"
                onClick={() => setShowDirectDocInput(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                placeholder="Tên tài liệu (VD: Full-paper-manuscript.pdf)"
                value={directDocName}
                onChange={(e) => setDirectDocName(e.target.value)}
                className="sm:col-span-5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
              />
              <input
                type="url"
                placeholder="https://arxiv.org/pdf/..."
                value={directDocUrl}
                onChange={(e) => setDirectDocUrl(e.target.value)}
                className="sm:col-span-5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
              />
              <button
                type="button"
                onClick={handleAddDirectDoc}
                disabled={!directDocUrl.trim()}
                className="sm:col-span-2 px-4 py-2 bg-[#0F294A] hover:bg-[#1A3E6B] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}

        {docError && (
          <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {docError}
          </p>
        )}

        {/* Attachments List */}
        {attachments.length === 0 ? (
          <div
            onClick={() => docInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-[#0F294A]/40 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
          >
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có tệp PDF nào được đính kèm</p>
            <p className="text-xs text-slate-500 mt-1">
              Nhấp để tải lên bài báo toàn văn, slide báo cáo hoặc phụ lục nghiên cứu (PDF tối đa 25MB)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-rose-200">
                    PDF
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 truncate">{doc.fileName}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      {doc.fileSize > 0 ? (
                        <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      ) : (
                        <span>Liên kết trực tiếp</span>
                      )}
                      <span>•</span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0F294A] hover:underline inline-flex items-center gap-0.5 font-bold"
                      >
                        <span>Xem tệp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">6. Nội dung chi tiết (Markdown)</h2>
        </div>
        <textarea
          rows={7}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mô tả phương pháp, kiến trúc, kết quả thử nghiệm chi tiết..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A] leading-relaxed"
        />
      </section>

      {/* Action Footer & Blocking Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu bản nháp'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#1A3E6B] active:scale-[0.98] text-white font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>
            {loading
              ? 'Đang xử lý...'
              : isAdmin
              ? 'Đăng xuất bản trực tiếp'
              : 'Gửi yêu cầu xét duyệt'}
          </span>
        </button>
      </div>
    </form>
  );
}
