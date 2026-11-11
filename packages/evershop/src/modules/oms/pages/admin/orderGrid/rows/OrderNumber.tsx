import { TableCell } from '@components/common/ui/Table.js';
import React from 'react';
import { PackageCheck } from 'lucide-react';

interface OrderNumberProps {
  editUrl: string;
  number: string;
  date?: string;
}

export function OrderNumber({ editUrl, number, date }: OrderNumberProps) {
  return (
    <TableCell>
      <div className="order-record-identity">
        <span className="order-record-icon">
          <PackageCheck size={16} />
        </span>
        <div>
          <a className="hover:underline font-semibold" href={editUrl}>
            #{number}
          </a>
          {date && <small className="table-secondary">{date}</small>}
        </div>
      </div>
    </TableCell>
  );
}
