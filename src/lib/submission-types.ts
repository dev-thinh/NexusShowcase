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
