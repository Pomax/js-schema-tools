import fs from "fs";
import path from "path";
import { conforms } from "./conforms.js";
import { createDiff, applyDiff, default_change_handler } from "../diffing/diff.js";

/**
 * load a schema from file
 */
function loadSchema(schemaPath) {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`File does not exist`);
  }
  const dir = path.dirname(schemaPath);
  const data = fs.readFileSync(schemaPath);
  // the following two lines may throw:
  const parsed = JSON.parse(data);
  linkSchema(dir, parsed);
  return parsed;
}

// resolve all external schema
function linkSchema(dir, obj) {
  const { __meta } = obj;

  // is this a schema'd property?
  if (__meta && __meta.schema) {
    obj.shape = loadSchema(`${dir}/${__meta.schema}`);
    delete __meta.schema;
    __meta.linked = true;
    return;
  }

  // find all fields that we need to recurse through.
  Object.entries(obj).forEach(([key, value]) => {
    if (key === `__meta`) return;
    const recursionData = value.shape
      ? value.shape
      : value.__meta
      ? value
      : undefined;
    if (recursionData) linkSchema(dir, recursionData);
  });
}

/**
 * Validate an object against a schema.
 */
function validate(schema, object, strict = true) {
  const results = conforms(schema, object, strict);
  if (!results.errors.length) {
    results.passed = true;
  }
  return results;
}

/**
 * convert a schema object to a validator.
 */
function createValidator(schema, strict = true) {
  return (object) => validate(schema, object, strict);
}

/**
 * Migrate an object from being schema1-conformal to schema2-conformal.
 */
function migrate(object, ...args) {
  const len = args.length;
  if (len === 1) {
    const [operations] = args;
    return migrateDirectly(object, operations);
  }
  if (len === 2) {
    const [schema1, schema2] = args;
    return migrateWithSchema(object, schema1, schema2);
  }
}

function migrateWithSchema(object, schema1, schema2) {
  const operations = makeMigration(schema1, schema2);
  return migrateDirectly(object, operations);
}

function migrateDirectly(object, operations) {
  return applyDiff(operations, object);
}

export {
  loadSchema,
  // Validation
  validate,
  createValidator,
  // Migrations
  migrate,
};
