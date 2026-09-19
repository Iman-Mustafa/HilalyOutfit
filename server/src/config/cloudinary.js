import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { HttpError } from '../utils/httpError.js';

export const cloudinaryEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Uploads an in-memory image buffer. Resolves to { url, publicId }. */
export function uploadImageBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.CLOUDINARY_FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          const err = new HttpError(502, 'Imeshindikana kupakia picha Cloudinary. Jaribu tena.');
          err.cause = error;
          return reject(err);
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/** Best-effort delete; never throws. */
export async function destroyImage(publicId) {
  if (!cloudinaryEnabled || !publicId) return;
  try {
    // invalidate: also clear the CDN copy, otherwise the deleted picture keeps loading from cache
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (err) {
    console.warn(`[cloudinary] Imeshindikana kufuta picha ${publicId}: ${err?.message || err}`);
  }
}
