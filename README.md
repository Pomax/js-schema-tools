# A set of JS Schema tools

- A basic JS object schema framework geared towards "data definition" rather than coomprehensive data validation (akin to table definitions in a database).
- A simple JSON-based human-readable, human-editable document store with schema support
- A JS differ that allows for three-way diffs (e.g. applying schema1 → schema2 transforms to _instances_ of schema1, to make them schema2-conformant).
- An `equals(o1, o2)` function that allows for both strict and coerced equality testing.

## Schema API

See [the schema docs](./lib/schema/README.md) for details.

- `loadSchema(path)`
- `validate(schema, object, strict = true)`
- `createValidator(schema, strict = true)`
- `migrate(object, schema1, schema1)`
- `migrate(object, migration_operations)`


## JSON Store API

See [the JSON store docs](./lib/store/README.md) for details.

- `store` / `new Store()` / `new JSONDataStore()`
- `load(namespace, schema)`
- `migrate(newschema)`
- `view(primaryKey)`
- `get(key)`
- `put(key)`
- `remove(key)`


## Diff API

See [the diffing docs](./lib/diff/README.md) for details.

- `create(object1, object2)` / `createDiff(object1, object2)`
- `apply(diff, object)` / `applyDiff(diff, object)`
- `makeChangeHandler(ignoreKey, filterKeyString)`

## Equals API

See [the docs for `equals()`](./lib/equal/README.md) for details.

`equals(o1, o2, strict = true)`
