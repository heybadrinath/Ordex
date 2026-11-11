import { buildUrl } from '@evershop/evershop/lib/router';
export default function supportPage(req, res, next) {
  if (!req.isCustomerLoggedIn()) {
    res.redirect(buildUrl('login'));
    return;
  }
  next();
}
