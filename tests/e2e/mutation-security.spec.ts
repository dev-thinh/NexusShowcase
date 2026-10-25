import { expect, login, test } from './fixtures';

test('authenticated mutation APIs reject missing and foreign origins', async ({ page, fixture }) => {
  await login(page, fixture.users[0]);
  for (const origin of [undefined, 'https://attacker.test', 'null']) {
    const headers: Record<string, string> = origin === undefined ? {} : { Origin: origin };
    for (const path of ['/api/home/moments', '/api/home/research']) {
      const response = await page.request.put(path, { headers, data: { version: 0, photos: [] } });
      expect(response.status(), `${path} must reject origin ${origin}`).toBe(403);
    }
    const response = await page.request.post('/api/upload', { headers, multipart: { type: 'thumbnail' } });
    expect(response.status(), `upload must reject origin ${origin}`).toBe(403);
  }
});
