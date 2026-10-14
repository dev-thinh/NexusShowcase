import React from 'react';

export interface ChecklistState {
  copyEdited: boolean;
  mediaChecked: boolean;
  metadataChecked: boolean;
}

interface ReviewChecklistProps {
  checklist: ChecklistState;
  onChangeChecklist: (key: keyof ChecklistState, value: boolean) => void;
  disabled?: boolean;
}

export function ReviewChecklist({
  checklist,
  onChangeChecklist,
  disabled = false,
}: ReviewChecklistProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-200">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Danh mục kiểm tra biên tập
      </h3>
      <div className="space-y-2 text-xs">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="copyEdited"
            checked={Boolean(checklist.copyEdited)}
            onChange={(e) => onChangeChecklist('copyEdited', e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-slate-700 leading-snug">
            Nội dung và câu từ đã được biên tập rõ ràng
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="mediaChecked"
            checked={Boolean(checklist.mediaChecked)}
            onChange={(e) => onChangeChecklist('mediaChecked', e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-slate-700 leading-snug">
            Ảnh đại diện và tài nguyên liên kết truy cập tốt
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="metadataChecked"
            checked={Boolean(checklist.metadataChecked)}
            onChange={(e) => onChangeChecklist('metadataChecked', e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-slate-700 leading-snug">
            Chuyên mục, tác giả và thông tin công bố đã chuẩn hóa
          </span>
        </label>
      </div>
    </div>
  );
}
