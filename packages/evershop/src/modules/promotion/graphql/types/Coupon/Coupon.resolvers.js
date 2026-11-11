// Modified for Ordex on 19 October 2026.
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
import { isRouteEnabled } from '../../../../../lib/util/featureScope.js';

export default {
  Cart: {
    applyCouponApi: (cart) =>
      isRouteEnabled('couponApply')
        ? buildUrl('couponApply', { cart_id: cart.uuid })
        : '',
    removeCouponApi: (cart) => {
      if (cart.coupon && isRouteEnabled('couponRemove')) {
        return buildUrl('couponRemove', {
          cart_id: cart.uuid,
          coupon: cart.coupon
        });
      }
      return null; // Return null if no coupon is applied, or handle as needed
    }
  }
};
