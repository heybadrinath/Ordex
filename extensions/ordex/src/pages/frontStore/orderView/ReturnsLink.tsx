import React from 'react';
import { ArrowUpRight } from 'lucide-react';
export default function ReturnsLink({ order }) {
  return (
    <>
      {order && (
        <a
          className="account-returns-link primary-button"
          href={`/account/support?order=${order.uuid}`}
        >
          Get help with this order <ArrowUpRight size={15} />
        </a>
      )}
      <a
        className="account-returns-link secondary-button"
        href={
          order ? `/account/returns?order=${order.uuid}` : '/account/returns'
        }
      >
        Returns & refunds <ArrowUpRight size={15} />
      </a>
    </>
  );
}
export const layout = { areaId: 'orderViewActions', sortOrder: 5 };
export const query = `query { order(uuid: getContextValue("orderUuid")) { uuid } }`;
