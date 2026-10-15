import type {
  EditorialOverrides,
  EffectivePublication,
  SubmissionResource,
  SubmissionSnapshot,
  SubmissionSnapshotSource,
} from '@/lib/submission-types';

function buildResources(source: SubmissionSnapshotSource): SubmissionResource[] {
  if (source.resources) {
    return source.resources.map((resource) => ({ ...resource }));
  }

  return [
    ...(source.links ?? []).map((link) => ({
      kind: 'LINK' as const,
      label: link.label,
      url: link.url,
      linkType: link.type,
    })),
    ...(source.attachments ?? []).map((attachment) => ({
      kind: attachment.mimeType.startsWith('image/') ? ('IMAGE' as const) : ('DOCUMENT' as const),
      label: attachment.fileName,
      url: attachment.fileUrl,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
    })),
  ];
}

export function buildSubmissionSnapshot(source: SubmissionSnapshotSource): SubmissionSnapshot {
  return {
    title: source.title,
    summary: source.summary,
    content: source.content ?? '',
    publishedYear: source.publishedYear ?? new Date().getFullYear(),
    suggestedField: source.suggestedField ?? '',
    customProjectType: source.customProjectType ?? '',
    contributors: source.contributors.map((contributor) => ({
      userId: contributor.userId ?? null,
      displayName: contributor.displayName ?? contributor.user?.fullName ?? null,
      externalName: contributor.externalName ?? null,
      externalAffiliation: contributor.externalAffiliation ?? null,
      externalLink: contributor.externalLink ?? null,
      role: contributor.role,
      customRoleTitle: contributor.customRoleTitle ?? null,
      displayOrder: contributor.displayOrder,
    })),
    resources: buildResources(source),
  };
}

export function mergeEditorialOverrides(
  snapshot: SubmissionSnapshot,
  overrides: EditorialOverrides
): EffectivePublication {
  return {
    ...snapshot,
    ...overrides,
    contributors: snapshot.contributors.map((contributor) => ({ ...contributor })),
    resources: snapshot.resources.map((resource) => ({ ...resource })),
  };
}
