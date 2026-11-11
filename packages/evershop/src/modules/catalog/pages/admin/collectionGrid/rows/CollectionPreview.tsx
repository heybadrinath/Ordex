import React from 'react';
import { Layers } from 'lucide-react';

type PreviewProduct = { image?: { url?: string } | null } | null;

export function CollectionPreview({
  products
}: {
  products?: PreviewProduct[] | null;
}) {
  const images = (products ?? []).flatMap((product) =>
    product?.image?.url ? [product.image.url] : []
  );
  return (
    <span className="collection-thumbnails">
      {images.length ? (
        images.map((url, index) => (
          <img
            key={`${url}-${index}`}
            src={url}
            alt=""
            width="33"
            height="38"
            loading="lazy"
          />
        ))
      ) : (
        <Layers size={20} aria-label="No product images" />
      )}
    </span>
  );
}
