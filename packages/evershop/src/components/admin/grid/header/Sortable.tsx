import { TableHead } from '@components/common/ui/Table.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import React from 'react';

export interface SortableHeaderProps {
  title: string;
  name: string;
  currentFilters: Array<{ key: string; value: string }>;
}

export function SortableHeader({
  title,
  name,
  currentFilters = []
}: SortableHeaderProps) {
  const currentOrderBy = currentFilters.find((filter) => filter.key === 'ob');
  const currentDirection =
    currentOrderBy?.value === name
      ? currentFilters.find((filter) => filter.key === 'od')?.value || 'asc'
      : null;
  const onChange = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('ob', name);
    const direction = currentFilters.find((filter) => filter.key === 'od');
    url.searchParams.set('od', direction?.value === 'desc' ? 'asc' : 'desc');
    window.location.href = url.toString();
  };
  const Icon =
    currentDirection === 'asc'
      ? ArrowUp
      : currentDirection === 'desc'
      ? ArrowDown
      : ArrowUpDown;

  return (
    <TableHead
      aria-sort={
        currentDirection === 'asc'
          ? 'ascending'
          : currentDirection === 'desc'
          ? 'descending'
          : 'none'
      }
    >
      <button
        type="button"
        className="table-sort-button"
        aria-label={_('Sort by ${column}', { column: title })}
        onClick={onChange}
      >
        <span>{title}</span>
        <Icon size={14} aria-hidden="true" />
      </button>
    </TableHead>
  );
}
