import Area from '@components/common/Area.js';
import { useProductListing } from '@components/frontStore/catalog/ProductListingContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { CollectionHeader } from './CollectionHeader.js';

/**
 * Heading for the all-products listing. The category page takes its title from
 * the category; this page has no entity, so the title is a fixed string — the
 * same one the route's page meta uses.
 */
export function ProductListingInfo() {
  const { products } = useProductListing();
  return (
    <>
      <Area id="productListingInfoBefore" noOuter />
      <CollectionHeader
        title={_('All products')}
        eyebrow="The complete collection"
        count={products.total}
        description={
          <p>A little character for your space, your desk and your everyday.</p>
        }
        images={products.items.flatMap((product) =>
          product.image ? [product.image] : []
        )}
      />
      <nav className="shop-category-links" aria-label="Browse collections">
        <a href="/products" aria-current="page">
          All finds
        </a>
        <a href="/living">Home & living</a>
        <a href="/workspace">Work & desk</a>
        <a href="/audio">Sound & tech</a>
        <a href="/everyday-carry">On the go</a>
        <a href="/kitchen">Kitchen & coffee</a>
      </nav>
      <span id="collection-products" />
      <Area id="productListingInfoAfter" noOuter />
    </>
  );
}
