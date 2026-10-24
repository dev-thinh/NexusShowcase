import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import type { MomentPhoto } from '@/features/publications/model/moments';

const initialPhotos: Omit<MomentPhoto, 'slot'>[] = [
  { id: 'collaboration', src: '/uploads/thumbnails/fixture-collaboration.png', title: 'Cùng nhau tìm lời giải', alt: 'Nhóm làm việc cùng laptop quanh một chiếc bàn', shape: 'wide', tilt: '-3deg', visible: true },
  { id: 'electronics', src: '/uploads/thumbnails/fixture-electronics.png', title: 'Bắt đầu từ những chi tiết nhỏ', alt: 'Cận cảnh các linh kiện trên bảng mạch điện tử', shape: 'portrait', tilt: '3deg', visible: true },
  { id: 'workshop', src: '/uploads/thumbnails/fixture-workshop.png', title: 'Ý tưởng gặp thực tế', alt: 'Kỹ sư làm việc bên thiết bị trong phòng thí nghiệm', shape: 'wide', tilt: '-2deg', visible: true },
  { id: 'prototype', src: '/uploads/thumbnails/fixture-prototype.png', title: 'Thử nghiệm. Điều chỉnh. Lặp lại.', alt: 'Đôi tay đang thao tác trên một bảng mạch tại bàn thử nghiệm', shape: 'square', tilt: '4deg', visible: true },
  { id: 'robotics', src: '/uploads/thumbnails/fixture-robotics.png', title: 'Từ bản vẽ đến nguyên mẫu', alt: 'Bàn thiết kế nhìn từ trên cao với bản vẽ và các dụng cụ', shape: 'wide', tilt: '-3deg', visible: true },
  { id: 'lab', src: '/uploads/thumbnails/fixture-lab.png', title: 'Một góc làm việc, nhiều góc nhìn', alt: 'Mọi người cùng làm việc với máy tính trong không gian sáng tạo', shape: 'portrait', tilt: '2deg', visible: true },
];

export const defaultMoments: MomentPhoto[] = initialPhotos.map((photo, slot) => ({ ...photo, slot, alt: photo.title }));


export const defaultResearchImages = ['workshop', 'robotics', 'electronics'].map((id, slot) => ({
  ...defaultMoments.find(photo => photo.id === id)!, slot,
}));

// A generated two-pixel PNG; no production photo assets are required by tests.
export const fixtureImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWMQqdgiUrGFAUIBACCOBQFdf8G7AAAAAElFTkSuQmCC', 'base64');
export const fixtureUpload = { name: 'collaboration.png', mimeType: 'image/png', buffer: fixtureImage };

export async function writeFixtureImages(root = process.cwd()) {
  const directory = path.join(root, 'public/uploads/thumbnails');
  await mkdir(directory, { recursive: true });
  await Promise.all(defaultMoments.map(photo => writeFile(path.join(directory, path.basename(photo.src)), fixtureImage)));
}
export async function removeFixtureImages(root = process.cwd()) {
  await Promise.all(defaultMoments.map(photo => rm(path.join(root, 'public', photo.src), { force: true })));
}
