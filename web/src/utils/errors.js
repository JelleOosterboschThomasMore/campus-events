// Finds the validation message for one form field in an ApiError (or returns '').
export function fieldError(error, field) {
  return error?.details?.find((detail) => detail.field === field)?.message ?? '';
}
