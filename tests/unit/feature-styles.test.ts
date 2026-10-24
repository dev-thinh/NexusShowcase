import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { expect, it } from 'vitest';
import config from '../../tailwind.config';

it('generates the feature switch dimensions and checked indicator used in production', async () => {
  const result = await postcss([tailwindcss(config)]).process('@tailwind utilities;', { from: undefined });
  expect(result.css).toContain('.h-11');
  expect(result.css).toContain('.peer-checked\\:translate-x-5');
});
