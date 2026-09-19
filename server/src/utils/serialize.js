// Turns Mongoose documents into the public JSON shapes of the API contract.
// Nothing here ever exposes _id, __v or passwordHash.

export const CATEGORY_LABELS = {
  suti: 'Suti za Kifahari',
  wanaume: 'Mavazi ya Kiume',
  wanawake: 'Mavazi ya Kike',
  viatu: 'Viatu vya Ngozi',
  accessories: 'Vifaa & Saa',
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS);

export const categoryLabel = (category) => CATEGORY_LABELS[category] || '';

const iso = (value) => (value instanceof Date ? value.toISOString() : value ? new Date(value).toISOString() : undefined);

export function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

export function serializeProduct(product) {
  const out = {
    id: String(product._id),
    name: product.name,
    category: product.category,
    categoryLabel: categoryLabel(product.category),
    price: product.price,
    description: product.description || '',
    image: product.image,
    images: Array.isArray(product.images) ? [...product.images] : [],
    sizes: Array.isArray(product.sizes) ? [...product.sizes] : [],
    colors: (product.colors || []).map((color) => ({ name: color.name, hex: color.hex })),
    inStock: Boolean(product.inStock),
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    featured: Boolean(product.featured),
  };
  if (product.originalPrice) out.originalPrice = product.originalPrice;
  if (product.badge) out.badge = product.badge;
  return out;
}

export function serializeOrder(order) {
  const customer = order.customer || {};
  const out = {
    id: order.reference,
    customer: {
      fullName: customer.fullName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      region: customer.region || '',
      district: customer.district || '',
      deliveryNotes: customer.deliveryNotes || '',
    },
    items: (order.items || []).map((item) => ({
      product: {
        id: String(item.product?._id || item.product),
        name: item.name,
        category: item.category,
        categoryLabel: categoryLabel(item.category),
        price: item.price,
        image: item.image,
      },
      quantity: item.quantity,
      selectedSize: item.selectedSize || '',
      selectedColor: item.selectedColor || '',
    })),
    amount: order.amount,
    currency: 'TZS',
    provider: order.provider,
    paymentPhone: order.paymentPhone,
    status: order.status,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
  };
  if (order.gatewayRef) out.gatewayRef = order.gatewayRef;
  if (order.failureReason) out.failureReason = order.failureReason;
  return out;
}
