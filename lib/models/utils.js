/**
 * This is a function for use with JSON.stringify(input, sortedObjectKeys, number)
 * that ensures that object keys are sorted in alphanumerical order.
 */
export function sortedObjectKeys(_, data) {
  // Ignore primitives.
  if (data === null) return null;
  if (typeof data !== "object") return data;

  // Also ignore iterables, which are type "object" but should not be sorted.
  if (data.__proto__.constructor.prototype[Symbol.iterator]) return data;

  // Then sort the object keys and yield a new object with that
  // ordering enforced by key insertion.
  const sorted = {};
  for (const key of Object.keys(data).sort()) sorted[key] = data[key];
  return sorted;
}

// deep-copy an object (not used atm, but it might as well be here).
export function copyFromSource(source, constructed = false) {
  const target = {};
  setDataFrom(source, target, constructed);
  return target;
}

// deep-assign one object to another.
export function setDataFrom(source, target, constructed = true) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === `object`) {
      if (target[key] === undefined) {
        target[key] = constructed ? new val.__proto__.constructor() : {};
      }
      setDataFrom(val, target[key]);
    } else {
      target[key] = val;
    }
  }
}

/**
 * Perform a tree-prune on a copy of a given model instance,
 * removing any keys that have values that match the default
 * value as indicated by the schema, IFF those values are not
 * marked as required, because required values should always
 * be explicitly stored.
 */
export function removeModelDefaults(instance) {
  const Model = instance.__proto__.constructor;
  const schema = Model.schema;
  const pruned = Model.create(instance);

  (function pruneTree(tree, schema) {
    Object.entries(tree).forEach(([key, value]) => {
      const definition = schema[key];

      // Model objects may have out-of-schema properties
      // tacked on to them. Ignore those for pruning.
      if (!definition) return;

      // Nested objects
      if (definition.shape) return pruneTree(value, definition.shape);

      // Plain value properties
      const dflt = definition.default;
      if (value === dflt) tree[key] = undefined;
    });
  })(pruned, schema);

  return pruned;
}
