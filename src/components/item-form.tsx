'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShowcaseItemAction, ContributorInput, LinkInput } from '@/actions/showcase-actions';
import { ItemType, ItemScope, ContributorRole, LinkType } from '@prisma/client';

export function ItemForm({
  currentUserId,
  clubMembers,
}: {
  currentUserId: string;
  clubMembers: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ItemType>('RESEARCH_PAPER');
  const [scope, setScope] = useState<ItemScope>('EXTERNAL');
  const [issuer, setIssuer] = useState('');
  const [publishedYear, setPublishedYear] = useState(new Date().getFullYear());
  const [thumbnailUrl, setThumbnailUrl] = useState('');

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
    { label: 'Liên kết bài báo', url: '', type: 'PAPER_URL' },
  ]);

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

  const addLink = () => {
    setLinks([...links, { label: '', url: '', type: 'OTHER' }]);
  };

  const handleSubmit = async (submitForReview: boolean) => {
    setLoading(true);
    setError(null);

    const result = await createShowcaseItemAction(currentUserId, {
      title,
      summary,
      content,
      type,
      scope,
      issuer,
      thumbnailUrl,
      publishedYear,
      contributors,
      links: links.filter((l) => l.url.trim() !== ''),
      submitForReview,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Có lỗi xảy ra');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <form className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm" onSubmit={(e) => e.preventDefault()}>
      {error && <div className="p-4 bg-rose-50 text-rose-800 rounded-lg text-sm">{error}</div>}

      {/* Thông tin cơ bản */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b pb-2">1. Thông tin chung</h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề bài viết / đề tài *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm"
            placeholder="Ví dụ: Phân đoạn ảnh y tế đa chiều..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phân loại *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            >
              <option value="RESEARCH_PAPER">Bài báo khoa học</option>
              <option value="PROJECT">Dự án công nghệ</option>
              <option value="ACHIEVEMENT">Thành tích / Cống hiến</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phạm vi *</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ItemScope)}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            >
              <option value="EXTERNAL">Bên ngoài (NCKH, ICPC...)</option>
              <option value="INTERNAL">Nội bộ CLB</option>
              <option value="CLUB_CONTRIBUTION">Cống hiến xây dựng CLB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Năm công bố *</label>
            <input
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tóm tắt (Abstract) *</label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm"
          />
        </div>
      </section>

      {/* Danh sách Tác giả & Đồng tác giả */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-bold text-slate-900">2. Danh sách Tác giả & Giảng viên hướng dẫn</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addInternalMember}
              className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-semibold hover:bg-blue-100"
            >
              + Thêm thành viên CLB
            </button>
            <button
              type="button"
              onClick={addExternalAuthor}
              className="px-3 py-1 text-xs bg-slate-100 text-slate-800 rounded-md font-semibold hover:bg-slate-200"
            >
              + Thêm Thầy/Cô hoặc tác giả ngoài
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {contributors.map((c, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-slate-50 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
              {c.userId !== undefined ? (
                <select
                  value={c.userId || ''}
                  onChange={(e) => {
                    const next = [...contributors];
                    next[idx].userId = e.target.value;
                    setContributors(next);
                  }}
                  className="px-3 py-1.5 border rounded-md text-sm bg-white"
                >
                  {clubMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Họ tên Thầy/Cô hoặc tác giả ngoài"
                    value={c.externalName || ''}
                    onChange={(e) => {
                      const next = [...contributors];
                      next[idx].externalName = e.target.value;
                      setContributors(next);
                    }}
                    className="px-3 py-1.5 border rounded-md text-sm bg-white"
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
                    className="px-3 py-1.5 border rounded-md text-sm bg-white"
                  />
                </>
              )}

              <select
                value={c.role}
                onChange={(e) => {
                  const next = [...contributors];
                  next[idx].role = e.target.value as ContributorRole;
                  setContributors(next);
                }}
                className="px-3 py-1.5 border rounded-md text-sm bg-white font-medium"
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
          ))}
        </div>
      </section>

      {/* Liên kết */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-bold text-slate-900">3. Liên kết (arXiv, Video YouTube, GitHub...)</h2>
          <button
            type="button"
            onClick={addLink}
            className="px-3 py-1 text-xs bg-slate-100 text-slate-800 rounded-md font-semibold hover:bg-slate-200"
          >
            + Thêm liên kết
          </button>
        </div>

        <div className="space-y-3">
          {links.map((link, idx) => (
            <div key={idx} className="flex gap-3">
              <input
                type="text"
                placeholder="Tên nút (VD: Xem trên arXiv)"
                value={link.label}
                onChange={(e) => {
                  const next = [...links];
                  next[idx].label = e.target.value;
                  setLinks(next);
                }}
                className="w-1/3 px-3 py-1.5 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="URL (https://...)"
                value={link.url}
                onChange={(e) => {
                  const next = [...links];
                  next[idx].url = e.target.value;
                  setLinks(next);
                }}
                className="w-2/3 px-3 py-1.5 border rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
        >
          Lưu bản nháp
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(true)}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm"
        >
          {loading ? 'Đang gửi...' : 'Gửi Thầy chủ nhiệm duyệt'}
        </button>
      </div>
    </form>
  );
}
