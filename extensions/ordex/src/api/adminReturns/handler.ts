import { listReturns, apiError } from '../../services/returns.js';
export default async (_request, response) => {
  try {
    response.json({ data: await listReturns() });
  } catch (error) {
    apiError(response, error);
  }
};
