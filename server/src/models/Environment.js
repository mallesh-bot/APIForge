import mongoose from 'mongoose';

const variableSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, default: '' },
    isSecret: { type: Boolean, default: false },
  },
  { _id: false }
);

const environmentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Environment name is required'],
      trim: true,
    },
    variables: [variableSchema],
  },
  { timestamps: true }
);

environmentSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Environment = mongoose.model('Environment', environmentSchema);
export default Environment;
