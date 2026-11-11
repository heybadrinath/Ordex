import React from 'react';
import { useProduct } from '@components/frontStore/catalog/ProductContext.js';
export default function ProductSummary() {
  const { description } = useProduct();
  const paragraph = description
    ?.flatMap((row) => row.columns || [])
    .flatMap((column) => column.data?.blocks || [])
    .find((block) => block.type === 'paragraph');
  const text = paragraph?.data?.text?.replace(/<[^>]+>/g, '');
  return text ? <p className="product-summary">{text}</p> : null;
}
export const layout = { areaId: 'productPageMiddleRight', sortOrder: 20 };
