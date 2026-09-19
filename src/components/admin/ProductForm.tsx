import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Product } from '../../types';
import { api, ApiError } from '../../lib/api';

interface ProductFormProps {
  /** The product being edited, or null to add a new one */
  product: Product | null;
  /** From `api.config()`; null while unknown (the file input then stays usable) */
  cloudinaryEnabled: boolean | null;
  onClose: () => void;
  /** Called after the server saved the product and the catalogue was refreshed */
  onSaved: (product: Product) => void;
  onAuthError?: (message: string) => void;
}

interface ColorRow {
  name: string;
  hex: string;
}

const CATEGORY_OPTIONS: { value: Product['category']; label: string }[] = [
  { value: 'suti', label: 'Suti za Kifahari' },
  { value: 'wanaume', label: 'Mavazi ya Kiume' },
  { value: 'wanawake', label: 'Mavazi ya Kike' },
  { value: 'viatu', label: 'Viatu vya Ngozi' },
  { value: 'accessories', label: 'Vifaa & Saa' }
];

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const KNOWN_FIELDS = ['name', 'category', 'price', 'originalPrice', 'description', 'sizes', 'colors', 'badge', 'image', 'imageUrl', 'inStock', 'featured'];

/** `<input type="color">` only accepts #rrggbb */
const toColorInputHex = (hex: string): string => {
  const value = hex.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return ('#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3]).toLowerCase();
  }
  return '#000000';
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');
const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

const FieldError: React.FC<{ message?: string }> = ({ message }) => (
  message ? <div role="alert" style={{ fontSize: '0.76rem', color: 'var(--danger)' }}>{message}</div> : null
);

export const ProductForm: React.FC<ProductFormProps> = ({ product, cloudinaryEnabled, onClose, onSaved, onAuthError }) => {
  const isEditing = product !== null;

  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState<Product['category']>(product?.category ?? 'suti');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? String(product.originalPrice) : '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [sizesText, setSizesText] = useState(product ? product.sizes.join(', ') : '');
  const [colors, setColors] = useState<ColorRow[]>(
    product && product.colors.length > 0
      ? product.colors.map(c => ({ name: c.name, hex: toColorInputHex(c.hex) }))
      : [{ name: '', hex: '#000000' }]
  );
  const [badge, setBadge] = useState(product?.badge ?? '');
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Local preview of the chosen file; the object URL is released when the file changes or the form closes
  const previewUrlRef = useRef('');
  const selectImageFile = (file: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : '';
    setImageFile(file);
    setFilePreview(previewUrlRef.current);
  };

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const uploadsDisabled = cloudinaryEnabled === false;
  const previewSrc = filePreview || imageUrl.trim() || product?.image || '';

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const resetFileInput = () => {
    selectImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    clearFieldError('image');

    if (!file) {
      selectImageFile(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      resetFileInput();
      setFieldErrors(prev => ({ ...prev, image: 'Picha lazima iwe JPG, PNG au WebP.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      resetFileInput();
      setFieldErrors(prev => ({ ...prev, image: 'Picha ni kubwa mno. Ukubwa wa juu ni MB 5.' }));
      return;
    }

    // A chosen file takes the place of a typed link
    selectImageFile(file);
    setImageUrl('');
    clearFieldError('imageUrl');
  };

  const handleImageUrlChange = (value: string) => {
    setImageUrl(value);
    clearFieldError('imageUrl');
    clearFieldError('image');
    if (value.trim() && imageFile) resetFileInput();
  };

  const updateColor = (index: number, patch: Partial<ColorRow>) => {
    setColors(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    clearFieldError('colors');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const sizes = sizesText.split(',').map(s => s.trim()).filter(Boolean);
    const cleanColors = colors
      .map(c => ({ name: c.name.trim(), hex: c.hex }))
      .filter(c => c.name !== '');
    const priceValue = Number(price);
    const originalPriceValue = originalPrice ? Number(originalPrice) : null;
    const trimmedUrl = imageUrl.trim();

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Weka jina la bidhaa.';
    if (!price || !Number.isFinite(priceValue) || priceValue <= 0) errors.price = 'Weka bei sahihi (namba kubwa kuliko 0).';
    if (originalPriceValue !== null && (!Number.isFinite(originalPriceValue) || originalPriceValue <= 0)) {
      errors.originalPrice = 'Bei ya awali lazima iwe namba kubwa kuliko 0.';
    }
    if (!description.trim()) errors.description = 'Weka maelezo ya bidhaa.';
    if (sizes.length === 0) errors.sizes = 'Weka angalau saizi moja (mf. S, M, L au One Size).';
    if (cleanColors.length === 0) errors.colors = 'Weka angalau rangi moja yenye jina.';
    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) errors.imageUrl = 'Kiungo lazima kianze na http:// au https://';
    if (!isEditing && !imageFile && !trimmedUrl) errors.image = 'Chagua picha au weka kiungo cha picha.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Tafadhali rekebisha sehemu zilizoonyeshwa.');
      return;
    }

    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('category', category);
    fd.append('price', String(priceValue));
    fd.append('originalPrice', originalPriceValue !== null ? String(originalPriceValue) : '');
    fd.append('description', description.trim());
    fd.append('sizes', JSON.stringify(sizes));
    fd.append('colors', JSON.stringify(cleanColors));
    fd.append('inStock', inStock ? 'true' : 'false');
    fd.append('featured', featured ? 'true' : 'false');
    fd.append('badge', badge.trim());
    // Image: only what the admin actually provided, so an edit without a new picture keeps the current one
    if (imageFile) fd.append('image', imageFile);
    else if (trimmedUrl) fd.append('imageUrl', trimmedUrl);

    setFieldErrors({});
    setFormError('');
    setIsSubmitting(true);
    try {
      const { product: saved } = product
        ? await api.updateProduct(product.id, fd)
        : await api.createProduct(fd);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        setFieldErrors(err.fieldErrors);
        if ((err.status === 401 || err.status === 403) && onAuthError) onAuthError(err.message);
      } else {
        setFormError('Hitilafu imetokea. Tafadhali jaribu tena.');
      }
      setIsSubmitting(false);
    }
  };

  // Server errors for fields this form does not show still need to be seen
  const otherErrors = Object.entries(fieldErrors).filter(([field]) => !KNOWN_FIELDS.includes(field));

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  };

  return (
    <div className="modal-backdrop" style={{ alignItems: 'flex-start', overflowY: 'auto' }}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Hariri bidhaa' : 'Ongeza bidhaa'}
        style={{
          width: '100%',
          maxWidth: '620px',
          margin: '1rem auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--gold-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem', marginBottom: '1.1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isEditing ? 'Hariri Bidhaa' : 'Ongeza Bidhaa'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Funga"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {(formError || otherErrors.length > 0) && (
          <div role="alert" style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.8rem',
            fontSize: '0.82rem',
            color: 'var(--danger)',
            marginBottom: '1rem'
          }}>
            {formError && <div>{formError}</div>}
            {otherErrors.map(([field, message]) => (
              <div key={field}>{message}</div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="product-name">Jina la bidhaa</label>
          <input
            id="product-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
            className="form-input"
          />
          <FieldError message={fieldErrors.name} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', columnGap: '1rem' }}>
          <div className="form-group" style={{ minWidth: 0 }}>
            <label className="form-label" htmlFor="product-category">Kundi</label>
            <select
              id="product-category"
              value={category}
              onChange={(e) => { setCategory(e.target.value as Product['category']); clearFieldError('category'); }}
              className="form-select"
            >
              {CATEGORY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <FieldError message={fieldErrors.category} />
          </div>

          <div className="form-group" style={{ minWidth: 0 }}>
            <label className="form-label" htmlFor="product-price">
              <span>Bei (TZS)</span>
              {price && <span style={{ color: 'var(--text-muted)' }}>{formatTZS(Number(price))}</span>}
            </label>
            <input
              id="product-price"
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => { setPrice(digitsOnly(e.target.value)); clearFieldError('price'); }}
              placeholder="mf. 150000"
              className="form-input"
            />
            <FieldError message={fieldErrors.price} />
          </div>

          <div className="form-group" style={{ minWidth: 0 }}>
            <label className="form-label" htmlFor="product-original-price">
              <span>Bei ya awali (si lazima)</span>
              {originalPrice && <span style={{ color: 'var(--text-muted)' }}>{formatTZS(Number(originalPrice))}</span>}
            </label>
            <input
              id="product-original-price"
              type="text"
              inputMode="numeric"
              value={originalPrice}
              onChange={(e) => { setOriginalPrice(digitsOnly(e.target.value)); clearFieldError('originalPrice'); }}
              placeholder="Kabla ya punguzo"
              className="form-input"
            />
            <FieldError message={fieldErrors.originalPrice} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="product-description">Maelezo</label>
          <textarea
            id="product-description"
            value={description}
            onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
            rows={4}
            className="form-textarea"
            style={{ resize: 'vertical' }}
          />
          <FieldError message={fieldErrors.description} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="product-sizes">Saizi (tenganisha kwa koma)</label>
          <input
            id="product-sizes"
            type="text"
            value={sizesText}
            onChange={(e) => { setSizesText(e.target.value); clearFieldError('sizes'); }}
            placeholder="mf. S, M, L, XL"
            className="form-input"
          />
          <FieldError message={fieldErrors.sizes} />
        </div>

        {/* Colors: repeatable rows */}
        <div className="form-group">
          <span className="form-label">Rangi</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {colors.map((row, index) => (
              <div key={index} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => updateColor(index, { name: e.target.value })}
                  placeholder="Jina la rangi (mf. Nyeusi)"
                  aria-label={`Jina la rangi ya ${index + 1}`}
                  className="form-input"
                  style={{ flex: '1 1 160px', width: 'auto', minWidth: 0 }}
                />
                <input
                  type="color"
                  value={row.hex}
                  onChange={(e) => updateColor(index, { hex: e.target.value })}
                  aria-label={`Chagua rangi ya ${index + 1}`}
                  style={{
                    width: '46px',
                    height: '42px',
                    padding: '3px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                />
                <button
                  type="button"
                  onClick={() => { setColors(prev => prev.filter((_, i) => i !== index)); clearFieldError('colors'); }}
                  disabled={colors.length === 1}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.5rem 0.8rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    opacity: colors.length === 1 ? 0.5 : 1,
                    cursor: colors.length === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Ondoa
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setColors(prev => [...prev, { name: '', hex: '#000000' }])}
            className="btn btn-outline-gold"
            style={{ alignSelf: 'flex-start', padding: '0.45rem 0.9rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', marginTop: '0.2rem' }}
          >
            Ongeza rangi
          </button>
          <FieldError message={fieldErrors.colors} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="product-badge">Lebo (si lazima)</label>
          <input
            id="product-badge"
            type="text"
            value={badge}
            onChange={(e) => { setBadge(e.target.value); clearFieldError('badge'); }}
            placeholder="mf. Mpya, Punguzo"
            className="form-input"
          />
          <FieldError message={fieldErrors.badge} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.6rem', marginBottom: '1rem' }}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              style={{ width: '17px', height: '17px', accentColor: 'var(--gold-primary)' }}
            />
            Ipo stoo
          </label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              style={{ width: '17px', height: '17px', accentColor: 'var(--gold-primary)' }}
            />
            Ionyeshwe juu ya ukurasa wa mwanzo
          </label>
        </div>

        {/* Image: upload a file or paste a link */}
        <div style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-elevated)',
          padding: '1rem',
          marginBottom: '1.2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            width: '112px',
            height: '140px',
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: previewSrc ? 0 : '0.5rem'
          }}>
            {previewSrc
              ? <img src={previewSrc} alt="Picha ya bidhaa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : 'Hakuna picha bado'}
          </div>

          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
              <label className="form-label" htmlFor="product-image">
                {isEditing ? 'Badilisha picha (si lazima)' : 'Picha ya bidhaa'}
              </label>
              <input
                id="product-image"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={uploadsDisabled}
                style={{
                  maxWidth: '100%',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  opacity: uploadsDisabled ? 0.55 : 1,
                  cursor: uploadsDisabled ? 'not-allowed' : 'pointer'
                }}
              />
              <div style={{ fontSize: '0.74rem', color: uploadsDisabled ? 'var(--pending)' : 'var(--text-muted)' }}>
                {uploadsDisabled
                  ? 'Cloudinary bado haijasanidiwa kwenye server — tumia kiungo cha picha.'
                  : 'JPG, PNG au WebP — isizidi MB 5.'}
              </div>
              <FieldError message={fieldErrors.image} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="product-image-url">au kiungo cha picha</label>
              <input
                id="product-image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://..."
                className="form-input"
              />
              {isEditing && !imageFile && !imageUrl.trim() && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Ukiacha wazi, picha ya sasa itabaki.
                </div>
              )}
              <FieldError message={fieldErrors.imageUrl} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary" style={{ flex: '1 1 120px', maxWidth: '180px' }}>
            Ghairi
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-gold"
            style={{ flex: '1 1 160px', maxWidth: '240px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? 'Inahifadhi…' : isEditing ? 'Hifadhi Mabadiliko' : 'Hifadhi Bidhaa'}
          </button>
        </div>
      </form>
    </div>
  );
};
