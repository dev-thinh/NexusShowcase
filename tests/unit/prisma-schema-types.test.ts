import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Prisma Schema Definitions', () => {
  it('contains ItemVisibility enum, CategoryLayout enum, and Category model in schema.prisma', () => {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');

    expect(content).toContain('enum ItemVisibility');
    expect(content).toContain('PUBLIC');
    expect(content).toContain('PRIVATE');

    expect(content).toContain('enum CategoryLayout');
    expect(content).toContain('SHOWCASE_GRID');
    expect(content).toContain('BIBLIOGRAPHY');
    expect(content).toContain('DATA_CATALOG');
    expect(content).toContain('HONOR_ROLL');

    expect(content).toContain('model Category');
    expect(content).toContain('layoutType');
    expect(content).toContain('isNavFeatured');
    expect(content).toContain('displayOrder');

    expect(content).toMatch(/visibility\s+ItemVisibility/);
    expect(content).toMatch(/mediaDriveUrl\s+String\?/);
    expect(content).not.toMatch(/tags\s+String\[\]/);
    expect(content).not.toContain('model Tag {');
    expect(content).not.toContain('model ItemTag {');
    expect(content).toMatch(/category\s+Category\?/);
  });

  it('declares the editorial workflow enums and persistence models', () => {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');

    expect(content).toContain('EDITOR');
    expect(content).toContain('REVISION_REQUESTED');
    expect(content).toContain('READY_FOR_APPROVAL');
    expect(content).toContain('ARCHIVED');
    expect(content).toContain('enum ReviewAudience');
    expect(content).toContain('enum ReviewSeverity');
    expect(content).toContain('enum ReviewCommentStatus');
    expect(content).toContain('model SubmissionRevision');
    expect(content).toContain('model EditorialDraft');
    expect(content).toContain('model ReviewComment');
    expect(content).toContain('model AuditEvent');
    expect(content).toContain('suggestedField');
    expect(content).toContain('customProjectType');
  });
});
