'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ItemStatus, ItemVisibility } from '@prisma/client';
import type { EditorialOverrides, SubmissionSnapshot } from '@/lib/submission-types';
import { SourceRevisionView } from './source-revision-view';
import { EditorialFields } from './editorial-fields';
import { ReviewChecklist, type ChecklistState } from './review-checklist';
import type { CommentItem } from './field-review-comments';
import { StatusBadge } from '@/components/ui/badge';
import {
  saveEditorialDraftAction,
  markReadyForApprovalAction,
  returnToEditorAction,
  requestAuthorRevisionAction,
  rejectShowcaseAction,
  addReviewCommentAction,
  resolveReviewCommentAction,
  assignEditorAction,
  publishEditorialDraftAction,
} from '@/actions/editorial-actions';

interface ReviewWorkspaceProps {
  item: {
    id: string;
    title: string;
    status: ItemStatus;
    slug: string;
    categoryId: string | null;
  };
  snapshot: SubmissionSnapshot;
  revisions: Array<{
    id: string;
    revisionNumber: number;
    submittedAt: Date | string;
    snapshot: any;
  }>;
  editorialDraft: {
    assignedEditorId: string | null;
    overrides: EditorialOverrides;
    checklist: any;
  } | null;
  categories: Array<{ id: string; name: string }>;
  comments: CommentItem[];
  currentUser: {
    id: string;
    role: 'EDITOR' | 'ADMIN';
    fullName: string | null;
  };
  previewUrl: string;
  memberNamesById?: Record<string, string>;
}

export function ReviewWorkspace({
  item,
  snapshot: initialSnapshot,
  revisions,
  editorialDraft,
  categories,
  comments: initialComments,
  currentUser,
  previewUrl,
  memberNamesById = {},
}: ReviewWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'source' | 'editorial'>('editorial');
  const [selectedRevisionNumber, setSelectedRevisionNumber] = useState<number>(
    revisions[0]?.revisionNumber ?? 1
  );

  const activeSnapshot =
    revisions.find((r) => r.revisionNumber === selectedRevisionNumber)?.snapshot ??
    initialSnapshot;

  const [overrides, setOverrides] = useState<EditorialOverrides>(
    editorialDraft?.overrides ?? {}
  );

  const [checklist, setChecklist] = useState<ChecklistState>({
    copyEdited: Boolean(editorialDraft?.checklist?.copyEdited),
    mediaChecked: Boolean(editorialDraft?.checklist?.mediaChecked),
    metadataChecked: Boolean(editorialDraft?.checklist?.metadataChecked),
  });

  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [publicationVisibility, setPublicationVisibility] = useState<ItemVisibility>('PRIVATE');
  const canEdit = currentUser.role === 'EDITOR' &&
    item.status === 'PENDING_REVIEW' &&
    editorialDraft?.assignedEditorId === currentUser.id;
  const isApproval = currentUser.role === 'ADMIN' && item.status === 'READY_FOR_APPROVAL';
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modals for prompt inputs
  const [modalMode, setModalMode] = useState<'return' | 'author_revision' | 'reject' | null>(
    null
  );
  const [modalReason, setModalReason] = useState('');

  const handleOverrideChange = <K extends keyof EditorialOverrides>(
    key: K,
    value: EditorialOverrides[K]
  ) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleRestoreField = <K extends keyof EditorialOverrides>(key: K) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleChecklistChange = (key: keyof ChecklistState, value: boolean) => {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await saveEditorialDraftAction(item.id, overrides);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Đã lưu bản biên tập thành công.' });
        router.refresh();
      } else {
        setStatusMessage({ type: 'error', text: res.error });
      }
    });
  };

  const handleAddComment = async (
    fieldKey: string,
    body: string,
    audience: 'EDITORIAL' | 'AUTHOR',
    severity: 'REQUIRED' | 'SUGGESTION'
  ) => {
    const res = await addReviewCommentAction({
      itemId: item.id,
      fieldKey,
      body,
      audience,
      severity,
    });
    if (res.success && res.data) {
      setComments((prev) => [
        {
          id: res.data.id,
          fieldKey,
          body,
          audience,
          severity,
          status: 'OPEN',
          author: { fullName: currentUser.fullName, email: '' },
          createdAt: new Date(),
        },
        ...prev,
      ]);
    } else if (!res.success) {
      alert(res.error);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    const res = await resolveReviewCommentAction(commentId);
    if (res.success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: 'RESOLVED' } : c))
      );
    } else {
      alert(res.error);
    }
  };

  const handleHandoff = () => {
    const catId = overrides.categoryId || item.categoryId;
    if (!catId) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng chọn Chuyên mục cho bản xuất bản trước khi gửi phê duyệt.',
      });
      return;
    }
    if (!checklist.copyEdited || !checklist.mediaChecked || !checklist.metadataChecked) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng hoàn thành tất cả các mục trong danh mục kiểm tra biên tập.',
      });
      return;
    }

    setStatusMessage(null);
    startTransition(async () => {
      const res = await markReadyForApprovalAction({
        itemId: item.id,
        categoryId: catId,
        checklist,
      });
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Đã bàn giao bản biên tập sẵn sàng để phê duyệt!',
        });
        router.refresh();
      } else {
        setStatusMessage({ type: 'error', text: res.error });
      }
    });
  };

  const handlePublish = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await publishEditorialDraftAction({
        itemId: item.id,
        checklist,
        visibility: publicationVisibility,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Đã xuất bản công trình.' });
        router.push(`/showcase/${item.slug}`);
        router.refresh();
      } else {
        setStatusMessage({ type: 'error', text: res.error });
      }
    });
  };

  const handleExecuteModalAction = () => {
    if (!modalReason.trim()) return;
    setStatusMessage(null);

    startTransition(async () => {
      if (modalMode === 'return') {
        const res = await returnToEditorAction(item.id, modalReason.trim());
        if (res.success) {
          setModalMode(null);
          setModalReason('');
          setStatusMessage({ type: 'success', text: 'Đã trả lại bài cho ban biên tập.' });
          router.refresh();
        } else {
          setStatusMessage({ type: 'error', text: res.error });
        }
      } else if (modalMode === 'author_revision') {
        const res = await requestAuthorRevisionAction({
          itemId: item.id,
          reason: modalReason.trim(),
          fieldKey: 'content',
        });
        if (res.success) {
          setModalMode(null);
          setModalReason('');
          setStatusMessage({
            type: 'success',
            text: 'Đã gửi yêu cầu bổ sung tới tác giả.',
          });
          router.refresh();
        } else {
          setStatusMessage({ type: 'error', text: res.error });
        }
      } else if (modalMode === 'reject') {
        const res = await rejectShowcaseAction({
          itemId: item.id,
          reason: modalReason.trim(),
        });
        if (res.success) {
          setModalMode(null);
          setModalReason('');
          setStatusMessage({
            type: 'success',
            text: 'Đã từ chối công trình.',
          });
          router.refresh();
        } else {
          setStatusMessage({ type: 'error', text: res.error });
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/reviews"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              ← Danh sách xét duyệt
            </Link>
            <span className="text-slate-300">|</span>
            <StatusBadge status={item.status} size="sm" />
            <h1 className="text-sm font-semibold text-slate-900 truncate max-w-md hidden sm:inline">
              {item.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={previewUrl}
              target="_blank"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Xem trước
            </Link>
            {canEdit && <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isPending}
              className="action-secondary-detail"
            >
              Lưu bản biên tập
            </button>}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div
            className={`p-3 rounded text-xs border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {statusMessage.text}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Mobile Tab Nav */}
        <div className="lg:hidden flex border-b border-slate-200 bg-white rounded-t mb-4">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'source'}
            onClick={() => setActiveTab('source')}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 ${
              activeTab === 'source'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Bản tác giả (Snapshot)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'editorial'}
            onClick={() => setActiveTab('editorial')}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 ${
              activeTab === 'editorial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Bản xuất bản (Biên tập)
          </button>
        </div>

        {/* Continuous Two-Column Document Grid */}
        <div className="panel-detail max-w-6xl overflow-hidden !p-0 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:divide-x divide-slate-200">
          {/* Left Column (40% desktop) - Read-only Source Revision */}
          <div
            className={`p-6 sm:p-8 ${
              activeTab === 'source' ? 'block' : 'hidden lg:block'
            }`}
          >
            <SourceRevisionView
              snapshot={activeSnapshot}
              revisions={revisions}
              selectedRevisionNumber={selectedRevisionNumber}
              onSelectRevision={setSelectedRevisionNumber}
              memberNamesById={memberNamesById}
              comments={comments}
              onAddComment={canEdit ? handleAddComment : undefined}
              onResolveComment={canEdit ? handleResolveComment : undefined}
            />
          </div>

          {/* Right Column (60% desktop) - Editorial Draft & Controls */}
          <div
            className={`p-6 sm:p-8 space-y-6 ${
              activeTab === 'editorial' ? 'block' : 'hidden lg:block'
            }`}
          >
            <EditorialFields
              snapshot={activeSnapshot}
              overrides={overrides}
              categories={categories}
              onChangeOverride={handleOverrideChange}
              onRestoreField={handleRestoreField}
              comments={comments}
              onAddComment={canEdit ? handleAddComment : undefined}
              onResolveComment={canEdit ? handleResolveComment : undefined}
              disabled={!canEdit || isPending}
            />

            <ReviewChecklist
              checklist={checklist}
              onChangeChecklist={handleChecklistChange}
              disabled={!canEdit || isPending}
            />
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 py-3 px-4 sm:px-6 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tác vụ quy trình xét duyệt:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Common: Request Author Revision */}
            {canEdit && (
            <button
              type="button"
              onClick={() => {
                setModalMode('author_revision');
                setModalReason('');
              }}
              disabled={isPending}
              className="action-secondary-detail"
            >
              Yêu cầu bổ sung
            </button>
            )}

            {/* EDITOR Action: Mark Ready for Approval */}
            {canEdit && (
              <button
                type="button"
                onClick={handleHandoff}
                disabled={isPending}
                className="action-primary-detail"
              >
                Gửi phê duyệt
              </button>
            )}

            {/* ADMIN Action: Return to Editor */}
            {isApproval && (
              <>
                <label className="sr-only" htmlFor="publication-visibility">Phạm vi xuất bản</label>
                <select
                  id="publication-visibility"
                  value={publicationVisibility}
                  onChange={(event) => setPublicationVisibility(event.target.value as ItemVisibility)}
                  disabled={isPending}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value="PRIVATE">Nội bộ</option>
                  <option value="PUBLIC">Công khai</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('return');
                    setModalReason('');
                  }}
                  disabled={isPending}
                  className="action-secondary-detail"
                >
                  Trả lại biên tập
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPending}
                  className="action-primary-detail"
                >
                  Xuất bản
                </button>
              </>
            )}

            {/* ADMIN Action: Reject */}
            {isApproval && (
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('reject');
                    setModalReason('');
                  }}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
                >
                  Không phê duyệt
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Action Dialog Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 text-slate-900 border border-slate-200">
            <h3 className="text-sm font-semibold">
              {modalMode === 'return' && 'Trả lại bản biên tập cho Editor'}
              {modalMode === 'author_revision' && 'Yêu cầu tác giả bổ sung thông tin'}
              {modalMode === 'reject' && 'Từ chối công trình'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {modalMode === 'return' &&
                'Nhập lý do hoặc chỉ dẫn nội bộ để biên tập viên tiếp tục hoàn thiện.'}
              {modalMode === 'author_revision' &&
                'Nhập phản hồi chi tiết để tác giả biết cần cập nhật số liệu, minh chứng nào.'}
              {modalMode === 'reject' &&
                'Nhập lý do từ chối công trình để lưu vào hồ sơ kiểm duyệt.'}
            </p>
            <textarea
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
              placeholder="Nhập lý do cụ thể..."
              rows={3}
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white text-slate-900"
              required
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteModalAction}
                disabled={isPending || !modalReason.trim()}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
