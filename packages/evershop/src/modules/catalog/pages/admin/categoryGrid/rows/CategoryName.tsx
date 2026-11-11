import { TableCell } from '@components/common/ui/Table.js';
import React from 'react';
import { FolderOpen } from 'lucide-react';

interface CategoryNameRowProps {
  category: {
    name: string;
    editUrl: string;
    image?: { url: string };
    path?: Array<{ name: string } | null> | null;
  };
}

export function CategoryNameRow({ category }: CategoryNameRowProps) {
  const path = category.path
    ?.map((item) => item?.name)
    .filter(Boolean)
    .join(' / ');
  return (
    <TableCell>
      <div className="catalog-name">
        <span className="catalog-icon">
          {category.image?.url ? (
            <img
              src={category.image.url}
              alt=""
              width="42"
              height="42"
              loading="lazy"
            />
          ) : (
            <FolderOpen size={18} />
          )}
        </span>
        <a className="hover:underline font-semibold" href={category.editUrl}>
          {path || category.name}
        </a>
      </div>
    </TableCell>
  );
}
