import Area from '@components/common/Area.js';
import { Editor } from '@components/common/Editor.js';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import React from 'react';
import { PackageCheck, RotateCcw, ArrowUpRight } from 'lucide-react';
import { CollectionHeader } from './CollectionHeader.js';

export function CategoryInfo() {
  const { name, description, image, products } = useCategory();
  return (
    <>
      <Area id="beforeCategoryInfo" />
      <CollectionHeader
        title={name}
        eyebrow="Made for the everyday"
        count={products.total}
        description={<Editor rows={description} />}
        images={
          [image, ...products.items.map((product) => product.image)]
            .filter(
              (item, index, images) =>
                item &&
                images.findIndex((candidate) => candidate?.url === item.url) ===
                  index
            )
            .slice(0, 3) as { url: string; alt?: string }[]
        }
      />
      <nav className="category-explore-strip" aria-label="More to explore">
        <span>
          <PackageCheck size={17} /> Free standard delivery
        </span>
        <span>
          <RotateCcw size={17} /> Returns within 7 days
        </span>
        <a href="/products">
          Explore all collections <ArrowUpRight size={17} />
        </a>
      </nav>
      <span id="collection-products" />
      <Area id="afterCategoryInfo" />
    </>
  );
}
