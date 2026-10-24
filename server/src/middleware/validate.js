export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return res.status(400).json({
          success: false,
          message: errors[0]?.message || 'Validation error',
          errors,
        });
      }
      req.body = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
