import { generateAPA, generateBibTeX, generateIEEE, getCitationKey } from '@/features/publications/model/citation';
import { describe, expect, it } from 'vitest';

describe('Academic Citation Generator', () => {
  const samplePaper = {
    title: 'ViMed-Seg: Deep Learning for Medical Image Segmentation',
    slug: 'vimed-seg-deep-learning',
    publishedYear: 2026,
    issuer: 'IEEE International Conference on Research 2026',
    contributors: [
      { user: { fullName: 'Nguyễn Hoàng Long' } },
      { externalName: 'PGS.TS. Trần Minh Triết' },
    ],
  };

  it('generates a clean bibtex citation key', () => {
    const key = getCitationKey(samplePaper);
    expect(key).toBe('nguyen2026vimedseg');
  });

  it('generates valid BibTeX format', () => {
    const bib = generateBibTeX(samplePaper);
    expect(bib).toContain('@inproceedings{nguyen2026vimedseg,');
    expect(bib).toContain('title = {{ViMed-Seg: Deep Learning for Medical Image Segmentation}},');
    expect(bib).toContain('author = {Nguyễn Hoàng Long and Trần Minh Triết},');
    expect(bib).toContain('year = {2026},');
    expect(bib).toContain('booktitle = {IEEE International Conference on Research 2026},');
  });

  it('generates valid APA 7th format', () => {
    const apa = generateAPA(samplePaper);
    expect(apa).toContain('Nguyễn, H. L., & Trần, M. T. (2026)');
    expect(apa).toContain('ViMed-Seg: Deep Learning for Medical Image Segmentation');
    expect(apa).toContain('IEEE International Conference on Research 2026');
  });

  it('generates valid IEEE format', () => {
    const ieee = generateIEEE(samplePaper);
    expect(ieee).toContain('"ViMed-Seg: Deep Learning for Medical Image Segmentation,"');
    expect(ieee).toContain('IEEE International Conference on Research 2026, 2026.');
  });
});
