import { updateReturn, apiError } from '../../services/returns.js';
export default async (request, response) => {
  try {
    response.json({
      data: await updateReturn(
        request.params.id,
        request.body.action,
        request.body,
        request.getCurrentUser().full_name
      )
    });
  } catch (error) {
    apiError(response, error);
  }
};
