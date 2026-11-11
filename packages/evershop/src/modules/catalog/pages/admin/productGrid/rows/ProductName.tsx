import { TableCell } from '@components/common/ui/Table.js';
import React from 'react';
import { Package } from 'lucide-react';

export interface ProductNameRowProps {
  name: string;
  url: string;
  sku?: string;
  image?: string;
}
export function ProductNameRow({ url, name, sku, image }: ProductNameRowProps) {
  return (
    <TableCell>
      <div className="product-record-identity">
        <a
          href={url}
          className="product-record-image"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image ? <img src={image} alt="" /> : <Package size={21} />}
        </a>
        <div>
          <a className="hover:underline font-semibold" href={url} title={name}>
            {name.length > 50 ? `${name.substring(0, 50)}...` : name}
          </a>
          {sku && <small className="table-secondary">{sku}</small>}
        </div>
      </div>
    </TableCell>
  );
}
