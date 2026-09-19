import multer from 'multer';
import { HttpError } from '../utils/httpError.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 40, fieldSize: 100 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new HttpError(400, 'Aina ya picha hairuhusiwi. Tumia JPG, PNG au WEBP tu.', { image: 'Tumia picha ya JPG, PNG au WEBP.' }));
  },
});

/** Parses multipart/form-data with an optional single file in the `image` field. */
export const uploadProductImage = upload.single('image');

/** Maps multer's own errors to friendly Swahili messages (used by the error handler). */
export function translateMulterError(err) {
  if (!(err instanceof multer.MulterError)) return null;
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new HttpError(413, 'Picha ni kubwa mno. Ukubwa wa juu ni MB 5.', { image: 'Picha isizidi MB 5.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return new HttpError(400, 'Tuma picha moja tu kwenye sehemu ya "image".', { image: 'Tuma picha moja tu.' });
  }
  return new HttpError(400, 'Fomu uliyotuma si sahihi. Tafadhali jaribu tena.');
}
