# Upstream attribution

Ordex includes the complete EverShop storefront, administration and commerce source from [evershopcommerce/evershop](https://github.com/evershopcommerce/evershop), release **v2.3.0**, commit **f33f72cd02bc20fd5d9b2b111bdda46b79b77200**.

EverShop is distributed under GPL-3.0. Its license is preserved in `LICENSE`; package-level notices remain with their source. The original repository license is retained in `LICENSES/Ordex-MIT.txt`. The original MIT notice does not replace the license of the included EverShop source.

Project changes add an Ordex visual theme, synthetic demonstration fixtures and payment handling, and customer/seller return management. See the README for the functionality verified in this application.

## Modified upstream files

- `packages/evershop/src/modules/checkout/pages/frontStore/checkoutSuccess/CustomerInfo.tsx`
- `packages/evershop/src/components/frontStore/checkout/CheckoutContext.tsx`
- `packages/evershop/src/components/frontStore/checkout/payment/BillingAddress.tsx`
- `packages/evershop/src/modules/customer/pages/frontStore/login/LoginPage.tsx`
- `packages/evershop/src/modules/cms/pages/admin/all/Survey.tsx`
- `packages/evershop/src/modules/cms/pages/admin/all/Logo.tsx`
- `packages/evershop/src/modules/cms/pages/admin/dashboard/PageHeading.tsx`
- `packages/evershop/src/modules/checkout/services/orderCreator.ts`
- `packages/evershop/src/modules/checkout/services/getAvailablePaymentMethods.ts`
- `packages/evershop/src/modules/auth/pages/admin/adminLogin/LoginForm.tsx`
- `packages/evershop/src/modules/oms/services/refundOrder.ts`
- `packages/evershop/src/modules/oms/services/updateShipmentStatus.ts`
- `packages/evershop/src/modules/oms/pages/admin/dashboard/Statistic.jsx`
- `packages/evershop/src/modules/oms/pages/admin/dashboard/Lifetimesales.jsx`
- `packages/evershop/src/modules/oms/pages/admin/orderEdit/RefundButton.tsx`
- `packages/evershop/src/modules/oms/api/lifetimesales/loadData.js`
- `packages/evershop/src/components/frontStore/Footer.tsx`
- `packages/evershop/src/components/frontStore/Header.tsx`
- `packages/evershop/src/components/frontStore/customer/LoginForm.tsx`
- `packages/evershop/src/components/frontStore/customer/AccountNav.tsx`
- `packages/evershop/src/bin/lib/bootstrap/migrate.js`
