import { TYPES } from "../equals/types.js";

/**
 * Verify that an object conforms to a schema.
 *
 * The "strict"" flag determines whether, when there is a type
 * mismatch, to apply js type coercion or not. If this flag is false,
 * values will be forced to the correct datatype *in place* so after
 * this function finishes, the input object will have been updated
 * to fit the schema.
 */
function conforms(
  schema,
  object,
  strict = true,
  results = {
    passed: false,
    warnings: [],
    errors: [],
  },
  prefix = false
) {
  const objectKeys = Object.keys(object);
  const schemaKeys = Object.keys(schema);

  objectKeys.forEach((key) => {
    if (schemaKeys.indexOf(key) < 0) {
      results.warnings.push(`${key}: not-in-schema property.`);
    }
  });

  schemaKeys
    .filter((v) => v !== `__meta`)
    .forEach((field_name) => {
      const ref = object[field_name];
      const schemaEntry = schema[field_name];
      const { type, choices, shape } = schemaEntry;
      const { required } = schemaEntry.__meta;
      const field = `${prefix ? `${prefix}.` : ``}${field_name}`;

      if (ref === undefined) {
        if (required) {
          if (schemaEntry.default === undefined) {
            return results.errors.push(`${field}: required field missing.`);
          } else {
            return results.warnings.push(`${field}: missing (required, but with default value specified).`);
          }
        } else {
          return results.warnings.push(`${field}: missing (but not required).`);
        }
      }

      if (choices && TYPES.mixed(ref, true, choices)) {
        return;
      }

      if (choices && !TYPES.mixed(ref, true, choices)) {
        if (!strict && TYPES.mixed(ref, false, choices)) {
          object[field_name] = coerce(ref, type, choices);
        } else {
          return results.errors.push(
            `${field}: value [${ref}] is not in the list of permitted values [${choices.join(`,`)}]`
          );
        }
      }

      if (shape) {
        return conforms(shape, ref, strict, results, field);
      }

      if (type && TYPES[type](ref, true, choices)) {
        return;
      }

      if (type && !TYPES[type](ref, true, choices)) {
        if (!strict && TYPES[type](ref, false, choices)) {
          object[field_name] = coerce(ref, type);
        } else {
          return results.errors.push(`${field}: value is not a valid ${type}.`);
        }
      }
    });

  return results;
}

// Force values to fit the type they need to be, if possible
function coerce(value, type, choices) {
  if (type) {
    if (type === `boolean`) {
      if (typeof value === `number`) {
        if (value === 0) return false;
        if (value === 1) return true;
      }
      if (typeof value === `string`) {
        const lc = value.toLocaleLowerCase();
        if (lc === `true`) return true;
        if (lc === `false`) return false;
      }
    }

    if (type === `number`) {
      if (typeof value === `string`) {
        return parseFloat(value);
      }
    }

    if (type === `string`) {
      return `${value}`;
    }
  }

  if (choices) {
    return choices.find((e) => e == value);
  }
}

export { conforms };
