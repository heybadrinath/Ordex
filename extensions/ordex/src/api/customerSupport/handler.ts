import {
  customerCommand,
  detail,
  listCases
} from '../../services/support/cases.js';
import { supportError, protect } from '../../services/support/http.js';
export default async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const customer = req.getCurrentCustomer();
  if (!customer)
    return res
      .status(401)
      .json({ error: { message: 'Sign in to get help with your order.' } });
  try {
    protect(req);
    const data =
      req.method === 'GET'
        ? req.query.caseId
          ? await detail(
              req.query.caseId,
              customer.customer_id,
              req.query.before
            )
          : await listCases(customer.customer_id)
        : await customerCommand(customer.customer_id, req.body);
    res.json({ data });
  } catch (error) {
    supportError(res, error);
  }
};
