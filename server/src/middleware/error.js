import mongoose from 'mongoose';
import { HttpError } from '../utils/httpError.js';
import { translateMulterError } from './upload.js';

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Ulichokitafuta hakipatikani.'));
}

const DUPLICATE_MESSAGES = {
  phone: 'Namba hii ya simu tayari imesajiliwa. Tafadhali ingia.',
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let message = 'Hitilafu ya ndani ya server. Tafadhali jaribu tena baadaye.';
  let errors;

  const multerError = translateMulterError(err);
  if (multerError) err = multerError;

  if (err instanceof HttpError) {
    ({ status, message, errors } = err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Taarifa ulizotuma si sahihi. Tafadhali rekebisha na ujaribu tena.';
    errors = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] =
        detail instanceof mongoose.Error.CastError ? 'Thamani uliyoweka si sahihi.' : detail.message;
    }
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Taarifa ulizotuma si sahihi.';
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message = DUPLICATE_MESSAGES[field] || 'Taarifa hii tayari ipo kwenye mfumo.';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Data uliyotuma si JSON sahihi.';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Data uliyotuma ni kubwa mno.';
  } else if (err?.type === 'charset.unsupported' || err?.type === 'encoding.unsupported') {
    status = 415;
    message = 'Muundo wa data uliyotuma hautumiki.';
  } else if (err?.expose === true && Number.isInteger(err?.status) && err.status >= 400 && err.status < 500) {
    // Other client errors raised by Express/body-parser internals.
    status = err.status;
    message = 'Ombi ulilotuma si sahihi.';
  }

  if (status >= 500) {
    // Logged server-side only; the client never sees stacks or internal messages.
    if (err instanceof HttpError) console.error(`[kosa] ${req.method} ${req.originalUrl} -> ${status} ${message}`, err.cause || '');
    else console.error(`[kosa] ${req.method} ${req.originalUrl}`, err);
  }

  if (res.headersSent) return;
  const body = { message };
  if (errors && Object.keys(errors).length > 0) body.errors = errors;
  res.status(status).json(body);
}
