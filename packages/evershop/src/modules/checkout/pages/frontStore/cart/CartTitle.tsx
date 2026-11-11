import { useCartState } from '@components/frontStore/cart/CartContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

/**
 * Cart page block: the title and the item count. A page component rather than
 * markup inside the `ShoppingCart` shell so a theme can move it from
 * `layouts.json`. Re-skin (2026-07-10): left-aligned title + "N items"
 * subtitle (reference, was centered "Shopping Cart" with a continue link).
 */
export default function CartTitle(): React.ReactElement {
  const { data: cart } = useCartState();
  const count = cart.items.length;
  return (
    <div className="shopping-cart-header mb-8">
      <span className="cart-heading-icon" aria-hidden="true">
        <ShoppingBag size={25} />
      </span>
      <div>
        <h1 className="shopping-cart-title text-3xl font-semibold tracking-tight">
          {_('Your cart')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count === 1
            ? _('1 item in your cart')
            : _('${count} items in your cart', { count: count.toString() })}
        </p>
      </div>
      <a className="cart-continue-link" href="/products">
        <ArrowLeft size={15} /> Keep exploring
      </a>
    </div>
  );
}

export const layout = {
  areaId: 'shoppingCartHeader',
  sortOrder: 10
};
