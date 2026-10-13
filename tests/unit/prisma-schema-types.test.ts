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

    expect(content).toContain('visibility      ItemVisibility');
    expect(content).toContain('mediaDriveUrl   String?');
    expect(content).toContain('tags            String[]');
    expect(content).toContain('category        Category?');
  });
});
