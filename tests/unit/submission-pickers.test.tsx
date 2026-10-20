import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ContributorEditor } from '@/components/submission/contributor-editor';
import { ResourceEditor } from '@/components/submission/resource-editor';
import { BasicInformationFields } from '@/components/submission/basic-information-fields';
import { ThumbnailPicker } from '@/components/submission/thumbnail-picker';
import { CustomSelect } from '@/components/ui/custom-select';
import { contributorInputSchema } from '@/lib/action-schemas';
import { SubmissionActionBar } from '@/components/submission/submission-action-bar';

vi.mock('@/actions/upload-actions', () => ({ uploadFileAction: vi.fn() }));
vi.stubGlobal('React', React);

describe('submission add controls', () => {
  it('starts with matching contributor actions and keeps member search collapsed', () => {
    const html = renderToStaticMarkup(
      <ContributorEditor value={[]} clubMembers={[{ id: 'member-1', fullName: 'Nguyễn An' }]} onChange={() => undefined} />,
    );

    expect(html).toContain('>Thêm thành viên CLB</button>');
    expect(html).toContain('>Thêm người bên ngoài</button>');
    expect(html.match(/flex-1/g)).toHaveLength(2);
    expect(html).toContain('Vai trò chi tiết');
    expect(html).not.toContain('justify-end gap-2 text-sm');
    expect(html).not.toContain('role="combobox"');
    expect(html).not.toContain('Nhập tên thành viên để tìm kiếm');
  });

  it('keeps contributor rows compact', () => {
    const html = renderToStaticMarkup(
      <ContributorEditor
        value={[{ userId: 'member-1', role: 'CONTRIBUTOR', displayOrder: 0 }]}
        clubMembers={[{ id: 'member-1', fullName: 'Nguyễn An' }]}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('!py-1.5');
    expect(html).toContain('h-9 w-9');
    expect(html).toContain('Thành viên đóng góp');
    expect(html).not.toContain('Vai trò (tùy chọn)');
  });

  it('preserves existing roles behind the details toggle and accepts custom role titles for saving', () => {
    const html = renderToStaticMarkup(<ContributorEditor value={[{ userId: 'cm000000000000000000000001', role: 'PROJECT_LEAD', displayOrder: 0 }]} clubMembers={[{ id: 'cm000000000000000000000001', fullName: 'Nguyễn An' }]} onChange={() => undefined} />);
    expect(html).toContain('Trưởng nhóm');
    expect(html).toContain('Vai trò chi tiết');
    expect(html).not.toContain('Vai trò của người đóng góp 1');
    expect(html).not.toContain('<select');
    const saved = contributorInputSchema.parse({ externalName: 'An', role: 'CUSTOM', customRoleTitle: 'Thiết kế phần cứng', displayOrder: 0 });
    expect(saved.customRoleTitle).toBe('Thiết kế phần cứng');
  });

  it('renders category and year in equal columns with an accessible custom dropdown', () => {
    const html = renderToStaticMarkup(<BasicInformationFields value={{ title: '', summary: '', type: 'PROJECT', suggestedField: '', customProjectType: '', contributors: [], resources: [], categoryId: 'robotics' }} errors={{ categoryId: ['Chọn lại chuyên mục'] }} onChange={() => undefined} categories={[{ id: 'robotics', name: 'Robotics & IoT', slug: 'robotics-iot' }]} />);
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('for="submission-category"');
    expect(html).toContain('id="submission-year"');
    expect(html).toContain('Robotics &amp; IoT');
    expect(html).toContain('aria-describedby="submission-category-error"');
    expect(html).not.toContain('<select');
  });

  it('places the thumbnail picker between title and abstract', () => {
    const html = renderToStaticMarkup(<BasicInformationFields value={{ title: 'Robot', summary: '', type: 'PROJECT', suggestedField: '', customProjectType: '', contributors: [], resources: [], thumbnailUrl: '/uploads/thumbnails/cover.png' }} errors={{}} onChange={() => undefined} />);
    expect(html.indexOf('id="submission-title"')).toBeLessThan(html.indexOf('id="submission-thumbnail"'));
    expect(html.indexOf('id="submission-thumbnail"')).toBeLessThan(html.indexOf('id="submission-summary"'));
    expect(html).toContain('/uploads/thumbnails/cover.png');
  });

  it('offers direct uploads and existing article images without losing the current thumbnail', () => {
    const html = renderToStaticMarkup(<ThumbnailPicker value="/uploads/thumbnails/cover.png" images={[{ id: 'figure', url: '/uploads/thumbnails/figure.png', alt: 'Sơ đồ', caption: '' }]} onChange={() => undefined} />);
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).toContain('Bỏ ảnh đại diện');
    expect(html).toContain('Chọn ảnh trong bài');
    expect(html).toContain('/uploads/thumbnails/cover.png');
    expect(html).toContain('/uploads/thumbnails/figure.png');
    expect(html).toContain('aria-pressed="false"');
  });

  it('labels the selected option in the custom dropdown', () => {
    const html = renderToStaticMarkup(<CustomSelect id="category" value="research" options={[{ value: 'research', label: 'Nghiên cứu khoa học' }]} onChange={() => undefined} />);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Nghiên cứu khoa học');
  });

  it('submits the initial filter value by name in GET forms', () => {
    const html = renderToStaticMarkup(<CustomSelect id="sort" name="sort" defaultValue="newest" options={[{ value: 'newest', label: 'Mới nhất' }]} />);
    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="sort"');
    expect(html).toContain('value="newest"');
    expect(html).toContain('Mới nhất');
  });

  it('exposes disabled and validation states with an accessible label', () => {
    const html = renderToStaticMarkup(<CustomSelect ariaLabel="Phạm vi xuất bản" name="visibility" value="PRIVATE" disabled invalid describedBy="visibility-error" options={[{ value: 'PRIVATE', label: 'Nội bộ' }]} />);
    expect(html).toContain('aria-label="Phạm vi xuất bản"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="visibility-error"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('Nội bộ');
  });

  it('starts with a resource action and keeps its custom menu collapsed', () => {
    const html = renderToStaticMarkup(<ResourceEditor value={[]} onChange={() => undefined} />);

    expect(html).toContain('>Thêm tài nguyên</button>');
    expect(html).not.toContain('<select');
    expect(html).not.toContain('role="menu"');
  });

  it('uses equal-sized draft and submit actions with the concise submit label', () => {
    const html = renderToStaticMarkup(
      <SubmissionActionBar saveState="idle" onSave={() => undefined} onSubmit={() => undefined} />,
    );

    expect(html).toContain('>Lưu bản nháp</button>');
    expect(html).toContain('>Gửi duyệt</button>');
    expect(html.match(/sm:w-40/g)).toHaveLength(2);
  });
});
