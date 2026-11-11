import React from 'react';
import { useProduct } from '@components/frontStore/catalog/ProductContext.js';

export default function ProductIntro() {
  const product = useProduct();
  return (
    <div className="product-overline">
      <span>THE ORDEX COLLECTION</span>
      <span
        className={`product-availability ${
          product.inventory.isInStock ? '' : 'unavailable'
        }`}
      >
        {product.inventory.isInStock
          ? 'In stock, ready for your everyday'
          : 'Currently unavailable'}
      </span>
    </div>
  );
}
export const layout = { areaId: 'productPageMiddleRight', sortOrder: 5 };
