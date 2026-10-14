import type { ItemType, LinkType } from '@prisma/client';
import type { ContributorInput } from '@/lib/action-schemas';

export type SubmissionResource = {
  kind: 'IMAGE' | 'DOCUMENT' | 'LINK';
  label: string;
  url: string;
  linkType?: LinkType;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

export interface SubmissionSnapshot {
  title: string;
  summary: string;
  content: string;
  publishedYear: number;
  suggestedField: string;
  customProjectType: string;
  contributors: ContributorInput[];
  resources: SubmissionResource[];
}

export interface EditorialOverrides {
  title?: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string | null;
  type?: ItemType;
  categoryId?: string | null;
  tags?: string[];
  issuer?: string | null;
  publishedYear?: number;
  resources?: SubmissionResource[];
}

export interface EffectivePublication extends SubmissionSnapshot {
  thumbnailUrl?: string | null;
  type?: ItemType;
  categoryId?: string | null;
  tags?: string[];
  issuer?: string | null;
}

export interface SubmissionSnapshotSource {
  title: string;
  summary: string;
  content?: string | null;
  publishedYear?: number | null;
  suggestedField?: string | null;
  customProjectType?: string | null;
  contributors: ContributorInput[];
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
  }>;
  links: Array<{ label: string; url: string; type: LinkType }>;
  attachments: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
}): SubmissionSnapshot & { id: string } {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    content: item.content ?? '',
    publishedYear: item.publishedYear ?? new Date().getFullYear(),
    suggestedField: item.suggestedField ?? '',
    customProjectType: item.customProjectType ?? '',
    contributors: item.contributors.map((entry) => ({
      userId: entry.userId,
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
