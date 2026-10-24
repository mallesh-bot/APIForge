import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    assertionType: { type: String, required: true },
    field: { type: String, default: '' },
    expected: { type: String, default: '' },
    actual: { type: String, default: '' },
    passed: { type: Boolean, required: true },
    message: { type: String, default: '' },
  },
  { _id: false }
);

const testRunSchema = new mongoose.Schema(
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
    },
    savedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedRequest',
      default: null,
    },
    passedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    results: [resultSchema],
  },
  { timestamps: true }
);

testRunSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const TestRun = mongoose.model('TestRun', testRunSchema);
export default TestRun;
