import crypto from "crypto";
import { equals } from "../equals/equals.js";
import { findSubtree } from "./object-recurse.js";

if (!Array.prototype.remove) {
  Array.prototype.remove = function (e) {
    const i = this.indexOf(e);
    if (i > -1) this.splice(i, 1);
    return this;
  };
}

// ...
function primitive(v) {
  if (v === true || v === false) return true;
  if (typeof v === `number`) return true;
  if (typeof v === `string`) return true;
  if (v instanceof Array) return true;
}

// ...
function stringHash(data) {
  return crypto.createHash(`md5`).update(data).digest(`hex`);
}

// ...
function valueHash(data) {
  if (typeof data === `boolean`) data = data.toString();
  else if (typeof data === `number`) data = data.toString();

  if (typeof data === `string`) return stringHash(data);

  if (data instanceof Array)
    return stringHash(data.map((v) => valueHash(v)).join(`\n`));

  return stringHash(
    Object.entries(data)
      .map(([key, value]) => `${key}${valueHash(value)}`)
      .join(`\n`)
  );
}

// uppercase regular expression replacement function
function ucre(_, letter) {
  return letter.toUpperCase();
}

// convert namespaces to something that'll work as part of a JS method name.
function camelCase(str, namespace) {
  if (namespace) str = `${namespace}.${str}`;
  return str.replace(/^\s*(\w)/, ucre).replace(/[_.]+(\w)/g, ucre);
}

/**
 * The most important function.
 *
 * @param {*} schema1
 * @param {*} schema2
 * @returns
 */
export function createDiff(schema1, schema2) {
  if (equals(schema1, schema2)) return [];

  const operations = diffUntilStable(schema1, schema2);

  // check for leftover subtree relocations:

  const removals = [];
  const additions = [];

  operations.forEach((op) => {
    if (op.stable === false) {
      if (op.type === `remove`) removals.push(op);
      if (op.type === `add`) additions.push(op);
    }
  });

  removals.forEach((removal) => {
    const subtree = removal.value;
    const matches = additions.map((addition) => ({
      ...findSubtree(subtree, addition.value),
      addition,
    }));
    const best = matches[0];
    const { match } = best;
    if (match === 0) {
      operations.remove(removal);
      operations.remove(best.addition);
      const newKey = `${best.addition.key}${best.node[0]}`;
      operations.push({
        type: `move`,
        oldKey: removal.key,
        newKey,
        fn: `move${camelCase(removal.key)}To${camelCase(newKey)}`,
        rollback: `rollback${camelCase(removal.key)}To${camelCase(newKey)}`,
      });
    } else {
      console.log(
        `*Maybe* moved ${removal.key} to ${best.addition.key}${best.node[0]}?`
      );
    }
  });

  // TODO: generate the migration JS code here
  const migrator = `generate the migration JS code here`;

  return operations;
}

// Perform breadth-first diff resolution: we first want to make sure all 1st level keys work out.
// Then we can sort out all 2nd level keys, and so on until we run out of objects to iterate into.
function diffUntilStable(s1, s2, key = false) {
  const orderedOperations = [];

  function fullKey(k = false) {
    if (k === false) return key;
    return `${key ? `${key}.` : ``}${k}`;
  }

  if (s1 === undefined && s2 !== undefined) {
    return [
      {
        type: `add`,
        key: fullKey(),
        value: s2,
        fn: `add${camelCase(fullKey())}`,
      },
    ];
  }

  if (s1 !== undefined && s2 === undefined) {
    return [
      {
        type: `remove`,
        key: fullKey(),
        value: s1,
        fn: `remove${camelCase(fullKey())}`,
      },
    ];
  }

  if (equals(s1, s2)) return [];

  if (primitive(s1) || primitive(s2)) {
    return [
      {
        type: `update`,
        key: fullKey(),
        oldValue: s1,
        newValue: s2,
        fn: `update${camelCase(key)}`,
        rollback: `rollback${camelCase(key)}`,
      },
    ];
  }

  const e1 = Object.entries(s1).sort();
  const e2 = Object.entries(s2).sort();

  const keys = Array.from(
    new Set([...e1.map(([k, _]) => k), ...e2.map(([k, _]) => k)])
  );

  e1.forEach(([k, v]) => {
    if (s2[k] === undefined) {
      orderedOperations.push({
        type: `remove`,
        key: fullKey(k),
        stable: false, // This might have been moved to somewhere else in the tree, we'll be able to check that later.
        value: v,
        valueHash: valueHash(v), // yeah we could compute this bottom up but let's be fair: "makemigrations" is not your bottleneck. Ever.
        fn: `remove${camelCase(fullKey(k))}`,
        rollback: `rollback${camelCase(fullKey(k))}`,
      });
    }
    keys.remove(k);
  });

  keys.forEach((k) => {
    const value = s2[k];
    const op = {
      type: `add`,
      key: fullKey(k),
      value: value,
      fn: `add${camelCase(k, key)}`,
      rollback: `rollback${camelCase(k, key)}`,
    };
    if (!primitive(value)) {
      op.stable = false; // this might be a relocation from somewhere else in the tree, we'll be able to check that later.
      op.valueHash = valueHash(value);
    }
    orderedOperations.push(op);
  });

  // find add/remove pairs with identical valueHashes. Note that this is not efficient, and it doesn't have to be.
  const removes = orderedOperations.filter((v) => v.type === `remove`);
  const pairs = removes
    .map((v) => ({
      remove: v,
      add: orderedOperations.find(
        (w) => w.type === `add` && w.valueHash === v.valueHash
      ),
    }))
    .filter((v) => !!v.add);

  // anything obvious we can unify?
  pairs.forEach((pair) => {
    const i1 = orderedOperations.indexOf(pair.add);
    const i2 = orderedOperations.indexOf(pair.remove);
    const rename = {
      type: `rename`,
      oldKey: pair.remove.key,
      newKey: pair.add.key,
      fn: `rename${camelCase(pair.remove.key)}${camelCase(pair.add.key)}`,
      rollback: `rollback${camelCase(pair.remove.key)}${camelCase(
        pair.add.key
      )}`,
    };
    orderedOperations.splice(i1 < i2 ? i1 : i2, 0, rename);
    orderedOperations.remove(pair.add);
    orderedOperations.remove(pair.remove);
  });

  // recurse
  e1.forEach(([k, v]) => {
    const redirect = orderedOperations.find((v) => v.from === k);
    if (redirect) k = redirect.to;
    if (s2[k] !== undefined) {
      const target = s2[k];
      orderedOperations.push(...diffUntilStable(v, target, fullKey(k)));
    }
  });

  return orderedOperations;
}

/**
 * The second most important function
 * @param {*} changeOperations
 * @param {*} object
 * @returns
 */
export function applyDiff(
  changeOperations,
  object,
  changeHandler = schemaChangeHandler
) {
  changeOperations.forEach((operation) => {
    changeHandler(object, operation);
    if (changeHandler[operation.fn] !== undefined) {
      changeHandler[operation.fn](object, operation);
    }
  });
  return object;
}

export function default_change_handler() {
  const activeKey = (key, type) => true;
  const filterKeyString = key => key;
  const fn = make_change_handler(activeKey, filterKeyString);
  fn.activeKey = activeKey;
  fn.getObjectLevel = getObjectLevel;
  fn.filterKeyString = filterKeyString;
  return fn;
}

export function schema_change_handler() {
  const filterKeyString = key => key.replaceAll(`.shape`, ``);
  const fn = make_change_handler(activeKeyForSchema, filterKeyString);
  fn.activeKey = activeKeyForSchema;
  fn.filterKeyString = filterKeyString;
  return fn;
}

function make_change_handler(activeKey, filterKeyString) {
  const changeHandler = function change_handler(object, operation) {
    const { type, key, value, fn, rollback } = operation;
    if (type === `add` && activeKey(key, type)) {
      const { level, propName } = getObjectLevel(object, key, filterKeyString);
      level[propName] = value;
      // then call the add hook
    }
    if (type === `remove` && activeKey(key, type)) {
      const { level, propName } = getObjectLevel(object, key, filterKeyString);
      delete level[propName];
      // then call the remove hook
    }
    if (type === `update` && activeKey(key, type)) {
      const { level, propName } = getObjectLevel(object, key, filterKeyString);
      const { oldValue, newValue, rollback } = operation;
      level[propName] = newValue;
      // then call the update hook
    }
    if (type === `move` || type === `rename`) {
      const { oldKey, newKey } = operation;
      const oldPosition = getObjectLevel(object, oldKey, filterKeyString);
      const newPosition = getObjectLevel(object, newKey, filterKeyString);
      newPosition.level[newPosition.propName] =
        oldPosition.level[oldPosition.propName];
      delete oldPosition.level[oldPosition.propName];
      // then call the move hook or rename hook
    }
  };
  changeHandler.getObjectLevel = getObjectLevel;
  return changeHandler;
}

// generic "get an object subtree by key string".
function getObjectLevel(object, key, filterKeyString) {
  key = filterKeyString(key);
  const nesting = key.split(`.`);
  const propName = nesting.pop();
  let level = object;
  while (nesting.length > 0) {
    let term = nesting.shift();
    if (level[term] === undefined) level[term] = {};
    level = level[term];
  }
  return { level: level ?? object, propName };
}

// Does this key actually warrant an object update?
function activeKeyForSchema(key, role) {
  if (key.includes(`__meta`)) return false;
  if (key.includes(`.default`)) return false;
  if (key.includes(`.choices`)) return false;
  return true;
}



// aliases
export { createDiff as create, applyDiff as apply };
