import path from "path";
import { conforms } from "./conforms.js";
import { createDiff, applyDiff, makeChangeHandler } from "../diff/diff.js";

let fs;
import("fs")
  .then((lib) => (fs = lib.default))
  .catch((e) => {
    const error = () => {
      throw new Error(`fs not available: not running in node`);
    };
    fs = {
      existsSync: error,
      readFileSync: error,
    };
  });

/**
 * load a schema from file
 */
export function loadSchema(schemaPath) {
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
export function validate(schema, object, strict = true) {
  const results = conforms(schema, object, strict);
  if (!results.errors.length) {
    results.passed = true;
  }
  return results;
}

/**
 * convert a schema object to a validator.
 */
export function createValidator(schema, strict = true) {
  return (object) => validate(schema, object, strict);
}

/**
 * Migrate an object from being schema1-conformant to schema2-conformant.
 */
export function migrate(object, ...args) {
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

// fall-through for migrate(object, schema1, schema2)
function migrateWithSchema(object, schema1, schema2) {
  const operations = createDiff(schema1, schema2);
  return migrateDirectly(object, operations);
}

// fall-through for migrate(object, diff)
function migrateDirectly(object, changeOperations) {
  const changeHandler = makeSchemaChangeHandler();
  applyDiff(changeOperations, object, changeHandler);
}

export function makeSchemaChangeHandler() {
  return makeChangeHandler(ignoreKey, filterKeyString);
}

function ignoreKey(key, _type) {
  if (key.includes(`__meta`)) return true;
  if (key.includes(`.default`)) return true;
  if (key.includes(`.choices`)) return true;
}

function filterKeyString(key) {
  return key.replaceAll(`.shape`, ``);
}
