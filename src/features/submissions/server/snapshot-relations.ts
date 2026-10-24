import type { Prisma } from '@prisma/client';
import { publicationResources } from '../model/article';
import type { SubmissionSnapshot } from '../model/snapshot';

export function snapshotRelations(snapshot: SubmissionSnapshot): {
  contributors: Prisma.ItemContributorCreateWithoutItemInput[];
  links: Prisma.ItemLinkCreateWithoutItemInput[];
  attachments: Prisma.ItemAttachmentCreateWithoutItemInput[];
} {
  const resources = publicationResources(snapshot.content, snapshot.resources);
  return {
    contributors: snapshot.contributors.map(contributor => ({
      user: contributor.userId ? { connect: { id: contributor.userId } } : undefined,
      externalName: contributor.externalName ?? null,
      externalAffiliation: contributor.externalAffiliation ?? null,
      externalLink: contributor.externalLink ?? null,
      role: contributor.role,
      customRoleTitle: contributor.customRoleTitle ?? null,
      displayOrder: contributor.displayOrder,
    })),
    links: resources.filter(resource => resource.kind === 'LINK').map(resource => ({ label: resource.label, url: resource.url, type: resource.linkType ?? 'OTHER' })),
    attachments: resources.filter(resource => resource.kind !== 'LINK').map(resource => ({
      fileName: resource.fileName ?? resource.label, fileUrl: resource.url, fileSize: resource.fileSize ?? 0,
      mimeType: resource.mimeType ?? (resource.kind === 'IMAGE' ? 'image/webp' : 'application/pdf'),
    })),
  };
}
