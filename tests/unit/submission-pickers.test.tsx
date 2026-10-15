import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ContributorEditor } from '@/components/submission/contributor-editor';
import { ResourceEditor } from '@/components/submission/resource-editor';
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
    expect(html).toContain('class="mt-2 inline-flex min-h-11 items-center');
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
    expect(html).toContain('>Gửi</button>');
    expect(html).not.toContain('Gửi duyệt');
    expect(html.match(/w-full sm:w-40/g)).toHaveLength(2);
  });
});
