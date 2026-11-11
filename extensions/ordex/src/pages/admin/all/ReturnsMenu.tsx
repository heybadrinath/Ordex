import React from 'react';
import { RotateCcw, Headphones, BookOpen } from 'lucide-react';
import { NavigationItemGroup } from '@components/admin/NavigationItemGroup.js';
export default function ReturnsMenu({ returnsUrl }: { returnsUrl: string }) {
  return (
    <NavigationItemGroup
      id="orderCare"
      name="Order care"
      items={[
        { Icon: Headphones, url: '/admin/support', title: 'Support inbox' },
        { Icon: RotateCcw, url: returnsUrl, title: 'Returns' },
        { Icon: BookOpen, url: '/admin/agent-setup', title: 'Agent setup' }
      ]}
    />
  );
}
export const layout = { areaId: 'adminMenu', sortOrder: 12 };
export const query = `query { returnsUrl: url(routeId:"sellerReturns") }`;
