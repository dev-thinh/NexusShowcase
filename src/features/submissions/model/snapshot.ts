import type { ContributorInput } from '@/features/submissions/model/input';
import type { ItemType, LinkType } from '@prisma/client';

export type SubmissionResource = {
  kind: 'IMAGE' | 'DOCUMENT' | 'LINK';
  label: string;
  url: string;
  linkType?: LinkType;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

export type SnapshotContributor = ContributorInput & {
  displayName?: string | null;
};

export interface SubmissionSnapshot {
  type?: 'RESEARCH_PAPER' | 'PROJECT';
  categoryId?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  summary: string;
  content: string;
  publishedYear: number;
  suggestedField: string;
  customProjectType: string;
  contributors: SnapshotContributor[];
  resources: SubmissionResource[];
}

export interface EditorialOverrides {
  title?: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string | null;
  type?: 'RESEARCH_PAPER' | 'PROJECT';
  categoryId?: string | null;
  issuer?: string | null;
  publishedYear?: number;
}

export interface EffectivePublication extends SubmissionSnapshot {
  thumbnailUrl?: string | null;
  type?: 'RESEARCH_PAPER' | 'PROJECT';
  categoryId?: string | null;
  issuer?: string | null;
}

export interface SubmissionSnapshotSource {
  type?: ItemType;
  categoryId?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  summary: string;
  content?: string | null;
  publishedYear?: number | null;
  suggestedField?: string | null;
  customProjectType?: string | null;
  contributors: Array<SnapshotContributor & { user?: { fullName: string | null } | null }>;
  resources?: SubmissionResource[];
  links?: Array<{ label: string; url: string; type: LinkType }>;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export function mapShowcaseItemToSubmission(item: {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  type?: ItemType;
  categoryId?: string | null;
  thumbnailUrl?: string | null;
  publishedYear: number | null;
  suggestedField: string | null;
  customProjectType: string | null;
  contributors: Array<{
    userId: string | null;
    externalName: string | null;
    externalAffiliation: string | null;
    externalLink: string | null;
    role: ContributorInput['role'];
    customRoleTitle: string | null;
    displayOrder: number;
    user?: { fullName: string | null } | null;
  }>;
  links: Array<{ label: string; url: string; type: LinkType }>;
  attachments: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
}): SubmissionSnapshot & { id: string } {
  return {
    id: item.id,
    type: item.type === 'RESEARCH_PAPER' ? 'RESEARCH_PAPER' : 'PROJECT',
    categoryId: item.categoryId,
    thumbnailUrl: item.thumbnailUrl,
    title: item.title,
    summary: item.summary,
    content: item.content ?? '',
    publishedYear: item.publishedYear ?? new Date().getFullYear(),
    suggestedField: item.suggestedField ?? '',
    customProjectType: item.customProjectType ?? '',
    contributors: item.contributors.map((entry) => ({
      userId: entry.userId,
      displayName: entry.user?.fullName ?? null,
      externalName: entry.externalName,
      externalAffiliation: entry.externalAffiliation,
      externalLink: entry.externalLink,
      role: entry.role,
      customRoleTitle: entry.customRoleTitle,
      displayOrder: entry.displayOrder,
    })),
    resources: [
      ...item.links.map((entry) => ({ kind: 'LINK' as const, label: entry.label, url: entry.url, linkType: entry.type })),
      ...item.attachments.map((entry) => ({
        kind: entry.mimeType.startsWith('image/') ? ('IMAGE' as const) : ('DOCUMENT' as const),
        label: entry.fileName,
        url: entry.fileUrl,
        fileName: entry.fileName,
        fileSize: entry.fileSize,
        mimeType: entry.mimeType,
      })),
    ],
  };
}
