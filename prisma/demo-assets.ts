import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export type DemoAssets = {
  thumbnails: Array<{ url: string; byteSize: number }>;
  avatars: Array<{ url: string; byteSize: number }>;
  document: { url: string; byteSize: number };
  resource: { url: string; byteSize: number };
};

const palettes = [
  ['#102b3f', '#51e0c0', '#ffcf70'], ['#271c45', '#bda0ff', '#ff8eae'],
  ['#13352f', '#9bdc91', '#ffd78c'], ['#24304c', '#83baff', '#ffa891'],
];
const subjects = ['AUTONOMOUS ROBOT', 'SENSOR NETWORK', 'RESEARCH SIGNALS', 'CIRCUIT LAB'];
const dimensions = [[1200, 760], [760, 1040], [900, 900], [1280, 720]];

function illustration(index: number): string {
  const [background, accent, secondary] = palettes[(index + Math.floor(index / 4)) % palettes.length];
  const [width, height] = dimensions[(index + Math.floor(index / 4)) % dimensions.length];
  const viewHeight = Math.round(900 * height / width);
  const nodes = Array.from({ length: 12 }, (_, n) => {
    const x = 80 + (n % 4) * 240, y = 130 + Math.floor(n / 4) * 180;
    return `<path d="M${x} ${y}h95v45h70"/><circle cx="${x}" cy="${y}" r="6" fill="${accent}"/>`;
  }).join('');
  const bars = Array.from({ length: 7 }, (_, n) => {
    const value = 35 + ((n * 37 + index * 19) % 125);
    return `<rect x="${330 + n * 43}" y="${380 - value}" width="24" height="${value}" rx="5" fill="${n % 2 ? secondary : accent}" opacity=".8"/>`;
  }).join('');
  const motif = index % 4 === 0 ? `
    <rect x="320" y="185" width="260" height="220" rx="52" fill="${background}" stroke="${accent}" stroke-width="7"/>
    <path d="M450 185v-42m-120 140h-52v85m292-85h52v85" stroke="${secondary}" stroke-width="12" fill="none"/>
    <circle cx="450" cy="140" r="12" fill="${secondary}"/>
    <rect x="355" y="235" width="190" height="70" rx="24" fill="${accent}" opacity=".18"/>
    <circle cx="395" cy="269" r="15" fill="${accent}"/><circle cx="505" cy="269" r="15" fill="${accent}"/>
    <path d="M400 350h100" stroke="${secondary}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="365" cy="425" r="27" fill="${secondary}"/><circle cx="535" cy="425" r="27" fill="${secondary}"/>` : index % 4 === 1 ? `
    <path d="M220 320L450 185 680 320 450 430Z M450 185v245 M220 320h460" stroke="${accent}" stroke-width="4" fill="${background}"/>
    ${[[220, 320], [450, 185], [680, 320], [450, 430]].map(([x, y], n) => `<circle cx="${x}" cy="${y}" r="38" fill="${background}" stroke="${secondary}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="10" fill="${accent}"/><text x="${x}" y="${y + 65}" text-anchor="middle" fill="${secondary}" font-size="15">NODE 0${n + 1}</text>`).join('')}` : index % 4 === 2 ? `
    <rect x="265" y="160" width="390" height="265" rx="20" fill="${background}" stroke="${accent}" stroke-width="3"/>
    <path d="M300 205v175h320" stroke="${secondary}" stroke-width="3" fill="none"/>${bars}
    <path d="M310 310l48-18 48 26 48-82 48 24 48-61 48 18" stroke="white" stroke-width="5" fill="none"/>` : `
    <rect x="320" y="180" width="260" height="240" rx="24" fill="${background}" stroke="${accent}" stroke-width="6"/>
    <rect x="380" y="240" width="140" height="120" rx="12" fill="${accent}" opacity=".25"/>
    ${Array.from({ length: 5 }, (_, n) => `<path d="M${345 + n * 50} 145v35m0 240v35M285 ${205 + n * 45}h35m260 0h35" stroke="${secondary}" stroke-width="9"/>`).join('')}
    <text x="450" y="310" fill="${accent}" font-size="34" text-anchor="middle">MCU</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 900 ${viewHeight}">
    <rect width="900" height="${viewHeight}" fill="${background}"/>
    <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="${accent}" stroke-opacity=".08" fill="none"/></pattern></defs>
    <rect width="900" height="${viewHeight}" fill="url(#grid)"/>
    <g fill="none" stroke="${accent}" stroke-width="2" opacity=".16">${nodes}</g>
    <g font-family="DejaVu Sans, sans-serif"><g transform="translate(0 ${(viewHeight - 600) / 2})">${motif}</g>
    <text x="52" y="62" fill="${accent}" font-size="19" letter-spacing="4">NEXUS / DEMO LAB ${String(index + 1).padStart(2, '0')}</text>
    <text x="52" y="${viewHeight - 65}" fill="white" font-size="32" font-weight="bold">${subjects[index % subjects.length]}</text>
    <text x="52" y="${viewHeight - 30}" fill="${secondary}" font-size="16" letter-spacing="2">FICTIONAL TECHNICAL ILLUSTRATION / DEMO ONLY</text>
    <rect x="725" y="30" width="120" height="42" rx="21" fill="${secondary}"/>
    <text x="785" y="58" text-anchor="middle" fill="${background}" font-size="22" font-weight="bold">DEMO</text></g>
  </svg>`;
}

function avatar(index: number): string {
  const [background, accent, secondary] = palettes[index % palettes.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" fill="${background}"/><circle cx="128" cy="125" r="104" fill="${accent}" opacity=".15"/>
    <path d="M128 55V30M45 108H25v45m186-45h20v45" stroke="${secondary}" stroke-width="9" fill="none"/>
    <circle cx="128" cy="29" r="9" fill="${accent}"/>
    <rect x="54" y="61" width="148" height="135" rx="${20 + index * 2}" fill="${background}" stroke="${accent}" stroke-width="6"/>
    <rect x="72" y="90" width="112" height="47" rx="20" fill="${accent}" opacity=".2"/>
    <circle cx="99" cy="113" r="${8 + index % 4}" fill="${secondary}"/><circle cx="157" cy="113" r="${8 + index % 4}" fill="${secondary}"/>
    <path d="M100 164h56" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
    <text x="128" y="232" font-family="DejaVu Sans, sans-serif" font-size="20" text-anchor="middle" fill="${secondary}">DEMO ${String(index + 1).padStart(2, '0')}</text>
  </svg>`;
}

function guidePdf(): Buffer {
  const stream = 'BT /F1 24 Tf 54 740 Td (NEXUS DEMO - Technical Guide) Tj 0 -48 Td /F1 12 Tf (Fictional local fixture. No real research claims or personal data.) Tj 0 -26 Td (1. Review the sensor network and robot illustrations.) Tj 0 -26 Td (2. Inspect charts, references and accessible document downloads.) Tj 0 -26 Td (3. Demo source is a benign plain-text resource.) Tj ET\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];
  let result = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(result)); result += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(result);
  result += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  result += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  result += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(result);
}

/** Local, deterministic fixtures. Existing files are only accepted if identical. */
export async function createDemoAssets(baseDirectory = process.cwd()): Promise<DemoAssets> {
  async function persist(folder: string, name: string, bytes: Buffer) {
    const directory = path.join(baseDirectory, 'storage', folder);
    await mkdir(directory, { recursive: true });
    const target = path.join(directory, name);
    try { await writeFile(target, bytes, { flag: 'wx' }); }
    catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
      if (!(await readFile(target)).equals(bytes)) throw new Error(`Existing demo asset differs: ${name}`);
    }
    return { url: `/uploads/${folder}/${name}`, byteSize: bytes.byteLength };
  }
  const thumbnails: DemoAssets['thumbnails'] = [], avatars: DemoAssets['avatars'] = [];
  for (let index = 0; index < 16; index++) thumbnails.push(await persist('thumbnails', `demo-full-${String(index + 1).padStart(2, '0')}.png`, await sharp(Buffer.from(illustration(index))).png().toBuffer()));
  for (let index = 0; index < 12; index++) avatars.push(await persist('thumbnails', `demo-full-avatar-${String(index + 1).padStart(2, '0')}.png`, await sharp(Buffer.from(avatar(index))).png().toBuffer()));
  const document = await persist('documents', 'demo-full-guide.pdf', guidePdf());
  const resource = await persist('resources', 'demo-full-source.txt', Buffer.from('NEXUS DEMO SOURCE\nFictional sensor-network example. No executable code or private data.\nNodes: robot, temperature, gateway, dashboard.\nFlow: sample -> validate -> aggregate -> display.\n'));
  return { thumbnails, avatars, document, resource };
}
