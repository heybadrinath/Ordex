import {
  listOrders,
  listReturns,
  createReturn,
  apiError
} from '../../services/returns.js';
export default async (request, response) => {
  const customer = request.getCurrentCustomer();
  if (!customer)
    return response
      .status(401)
      .json({ error: { message: 'Sign in to view your returns.' } });
  try {
    if (request.method === 'GET')
      return response.json({
        data: {
          orders: await listOrders(customer.customer_id),
          returns: await listReturns(customer.customer_id)
        }
      });
    response
      .status(201)
      .json({ data: await createReturn(customer.customer_id, request.body) });
  } catch (error) {
    apiError(response, error);
  }
};
