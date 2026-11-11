import React from 'react';
import { ArrowDown } from 'lucide-react';

export function CollectionHeader({
  title,
  eyebrow,
  description,
  images,
  count
}: {
  title: string;
  eyebrow: string;
  description: React.ReactNode;
  images: { url: string; alt?: string }[];
  count: number;
}) {
  return (
    <section className="collection-intro" aria-label={title}>
      <div className="collection-intro-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <div className="collection-intro-description">{description}</div>
        <a href="#collection-products" className="collection-intro-link">
          Explore {count} {count === 1 ? 'find' : 'finds'}{' '}
          <ArrowDown size={16} />
        </a>
      </div>
      {images.length > 0 && (
        <div
          className={`collection-intro-images images-${Math.min(
            images.length,
            3
          )}`}
          aria-hidden="true"
        >
          {images.slice(0, 3).map((image, index) => (
            <img key={`${image.url}-${index}`} src={image.url} alt="" />
          ))}
        </div>
      )}
    </section>
  );
}
