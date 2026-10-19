import { buildUrl } from '@evershop/evershop/lib/router';
import { getContextValue, setContextValue } from '@evershop/evershop/graphql/services';

export default function customerReturnPage(request, response, next) {
  if (!request.isCustomerLoggedIn()) {
    response.redirect(buildUrl('login'));
    return;
  }
  setContextValue(request, 'pageInfo', {
    ...getContextValue(request, 'pageInfo', {}),
    title: 'Returns & refunds · Ordex',
    description: 'Request a return and follow its progress.'
  });
  next();
}
