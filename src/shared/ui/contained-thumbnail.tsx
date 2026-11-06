import { MediaImage } from './media-image';

/** Keep the frame fixed while rounding the visible image at its natural ratio. */
export function ContainedThumbnail({ src, alt }: { src: string; alt: string }) {
  return <div className="article-header-thumbnail">
    <MediaImage src={src} alt={alt} width={240} height={180} sizes="240px" className="article-header-thumbnail__image" />
  </div>;
}
