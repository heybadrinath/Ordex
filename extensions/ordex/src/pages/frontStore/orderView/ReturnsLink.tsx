import React from 'react';
export default function ReturnsLink() {
  return (
    <a
      className="account-returns-link secondary-button"
      href="/account/returns"
    >
      Returns & refunds ↗
    </a>
  );
}
export const layout = { areaId: 'content', sortOrder: 5 };
