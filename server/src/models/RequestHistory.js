import mongoose from 'mongoose';

const requestHistorySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
    },
    statusText: {
      type: String,
      default: '',
    },
    durationMs: {
      type: Number,
    },
    responseSize: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

requestHistorySchema.index({ ownerId: 1, timestamp: -1 });

requestHistorySchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const RequestHistory = mongoose.model('RequestHistory', requestHistorySchema);
export default RequestHistory;
