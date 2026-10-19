import React from 'react';
import { RotateCcw } from 'lucide-react';
import { NavigationItemGroup } from '@components/admin/NavigationItemGroup';
export default function ReturnsMenu({ returnsUrl }: { returnsUrl: string }) {
  return (
    <NavigationItemGroup
      id="orderCare"
      name="Order care"
      items={[{ Icon: RotateCcw, url: returnsUrl, title: 'Returns' }]}
    />
  );
}
export const layout = { areaId: 'adminMenu', sortOrder: 12 };
export const query = `query { returnsUrl: url(routeId:"sellerReturns") }`;
