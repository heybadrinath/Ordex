import { TableCell } from '@components/common/ui/Table.js';
import React from 'react';
import { RecordAvatar } from '@components/admin/RecordAvatar.js';

interface CustomerNameProps {
  name: string;
  url: string;
  email?: string;
}

export function CustomerName({ url, name, email }: CustomerNameProps) {
  return (
    <TableCell>
      <div className="customer-identity">
        <RecordAvatar name={name} />
        <div>
          <a className="hover:underline font-semibold" href={url}>
            {name}
          </a>
          {email && <small>{email}</small>}
        </div>
      </div>
    </TableCell>
  );
}
