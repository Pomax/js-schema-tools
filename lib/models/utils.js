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
