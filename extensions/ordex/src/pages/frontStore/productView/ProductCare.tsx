import React from 'react';
import { Truck, RotateCcw, PackageCheck } from 'lucide-react';
import { useProduct } from '@components/frontStore/catalog/ProductContext.js';

export default function ProductCare() {
  const { sku } = useProduct();
  return (
    <>
      <div className="product-service-list">
        <div>
          <Truck size={21} />
          <span>
            <strong>Free standard delivery</strong>
            <p>Follow every step from your account.</p>
          </span>
        </div>
        <div>
          <RotateCcw size={21} />
          <span>
            <strong>Time to make up your mind</strong>
            <p>Request a return within 7 days of delivery.</p>
          </span>
        </div>
        <div>
          <PackageCheck size={21} />
          <span>
            <strong>Everything in one place</strong>
            <p>Your orders, returns and refund updates.</p>
          </span>
        </div>
      </div>
      <div className="product-details-fold">
        <details>
          <summary>Delivery & returns</summary>
          <p>
            Shipping is calculated before you place your order. Returns begin in
            your account and are reviewed after the item is received and
            inspected.
          </p>
        </details>
        <details>
          <summary>Product reference</summary>
          <p>
            SKU: {sku}. This is a sample product in the Ordex demonstration
            store. Product photography is illustrative and payments are
            simulated.
          </p>
        </details>
      </div>
    </>
  );
}
export const layout = { areaId: 'productPageMiddleRight', sortOrder: 40 };
