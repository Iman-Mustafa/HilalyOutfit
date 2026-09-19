import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Jina linahitajika.'],
      trim: true,
      minlength: [2, 'Jina liwe na angalau herufi 2.'],
      maxlength: [60, 'Jina lisizidi herufi 60.'],
    },
    // Always stored normalized: 0XXXXXXXXX
    phone: {
      type: String,
      required: [true, 'Namba ya simu inahitajika.'],
      unique: true,
      trim: true,
      match: [/^0[67]\d{8}$/, 'Namba ya simu si sahihi.'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
