/**
 * Create an object that has all the "default" values as indicated by a schema.
 */
export function createDefault(schema) {
  return Object.fromEntries(
    Object.entries(schema)
      .map(([key, value]) => {
        if (key === `__meta`) return false;
        if (value.default !== undefined) return [key, value.default];
        if (value.shape) return [key, createDefault(value.shape)];
      })
      .filter(Boolean)
  );
}
