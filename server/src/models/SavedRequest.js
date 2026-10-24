import mongoose from 'mongoose';

const keyValueSchema = new mongoose.Schema(
  {
    key: { type: String, default: '' },
    value: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const authSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['none', 'bearer', 'basic', 'apikey'],
      default: 'none',
    },
    token: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    apiKeyHeader: { type: String, default: '' },
    apiKeyValue: { type: String, default: '' },
  },
  { _id: false }
);

const bodySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['none', 'json', 'raw'],
      default: 'none',
    },
    content: { type: String, default: '' },
  },
  { _id: false }
);

const assertionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    field: { type: String, default: '' },
    expected: { type: String, default: '' },
    operator: { type: String, default: '' },
  },
  { _id: false }
);

const savedRequestSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Request name is required'],
      trim: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      required: true,
    },
    urlTemplate: {
      type: String,
      default: '',
    },
    params: [keyValueSchema],
    headers: [keyValueSchema],
    auth: {
      type: authSchema,
      default: () => ({ type: 'none' }),
    },
    body: {
      type: bodySchema,
      default: () => ({ type: 'none' }),
    },
    assertions: [assertionSchema],
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

savedRequestSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const SavedRequest = mongoose.model('SavedRequest', savedRequestSchema);
export default SavedRequest;
