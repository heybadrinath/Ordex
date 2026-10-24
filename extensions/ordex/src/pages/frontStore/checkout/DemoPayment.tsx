import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  useCheckout,
  useCheckoutDispatch
} from '@components/frontStore/checkout/CheckoutContext.js';
import { Button } from '@components/common/ui/Button.js';
import { toast } from '@components/common/ui/Sonner.js';

function PlaceDemoOrder() {
  const { checkout } = useCheckoutDispatch();
  const { loadingStates, orderPlaced } = useCheckout();
  return (
    <Button
      type="button"
      size="xl"
      className="w-full"
      disabled={loadingStates.placingOrder || orderPlaced}
      isLoading={loadingStates.placingOrder}
      loadingText="Placing your order…"
      onClick={async () => {
        try {
          await checkout();
        } catch (error) {
          toast.error(error.message || 'Could not place your order.');
        }
      }}
    >
      {loadingStates.placingOrder
        ? 'Placing order…'
        : orderPlaced
        ? 'Order placed'
        : 'Place demo order'}
    </Button>
  );
}

export default function DemoPayment() {
  const { checkoutSuccessUrl, orderPlaced, orderId, checkoutData } =
    useCheckout();
  const { registerPaymentComponent } = useCheckoutDispatch();
  useEffect(() => {
    registerPaymentComponent('demo', {
      nameRenderer: () => (
        <span className="flex items-center gap-2">
          <CheckCircle2 size={18} /> Demo payment
        </span>
      ),
      formRenderer: () => (
        <p className="text-sm py-4 text-muted-foreground">
          Place a sample order. No card details or real payment are needed.
        </p>
      ),
      checkoutButtonRenderer: PlaceDemoOrder
    });
  }, [registerPaymentComponent]);
  useEffect(() => {
    if (orderPlaced && checkoutData.paymentMethod === 'demo')
      window.location.href = `${checkoutSuccessUrl}/${orderId}`;
  }, [orderPlaced, orderId, checkoutSuccessUrl, checkoutData.paymentMethod]);
  return null;
}
export const layout = { areaId: 'checkoutFormAfter', sortOrder: 15 };
