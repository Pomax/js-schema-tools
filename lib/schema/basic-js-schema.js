import fs from "fs";
import path from "path";
import { conforms } from "./conforms.js";
import { createDiff, applyDiff, makeChangeHandler } from "../diff/diff.js";

/**
 * Get the latest schema, loaded from the relevant schema dir.
 * @param {*} dir
 * @param {*} schemaName
 * @returns
 */
export function getLatestSchema(dir, schemaName) {
  const { filepath, version } = getLatestSchemaFilePath(dir, schemaName);
  if (!fs.existsSync(filepath)) return;

  const schema = loadSchemaFromFilePath(filepath);
  Object.defineProperty(schema.__meta, `version`, {
    configurable: false,
    enumerable: false,
    value: version
  })
  return schema;
}

// determine the latest schema file, based on version number
export function getLatestSchemaFilePath(dir, schemaName) {
  const re = new RegExp(`${schemaName}\\.(\\d+)\\.json`);
  const versions = fs
    .readdirSync(dir)
    .filter((n) => n.match(re))
    .map((n) => {
      const s = n.replace(re, `$1`);
      return parseInt(s);
    });
  const version = versions.sort((a, b) => b - a)[0];
  return {
    filepath: `${dir}/${schemaName}.${version}.json`,
    version,
  };
}

/**
 * load a schema from file
 */
export function loadSchemaFromFilePath(schemaPath) {
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
  if (__meta && __meta.schema && __meta.schemaName) {
    const subschema = getLatestSchema(`${dir}/../../${__meta.schemaName}/.schema/`, __meta.schema);
    obj.__meta = subschema.__meta;
    delete subschema.__meta;
    obj.shape = subschema;
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
