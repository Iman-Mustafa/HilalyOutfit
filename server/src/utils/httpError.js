/** Error carrying an HTTP status and a Swahili, user-facing message. */
export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.expose = true;
    if (errors && Object.keys(errors).length > 0) this.errors = errors;
  }
}

export const validationError = (errors, message = 'Tafadhali rekebisha makosa kwenye fomu.') =>
  new HttpError(400, message, errors);
