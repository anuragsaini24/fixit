export const modelOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform(_document, value) {
      value.id = String(value._id);
      delete value._id;
      delete value.passwordHash;
      return value;
    },
  },
};