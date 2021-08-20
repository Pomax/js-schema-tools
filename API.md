# A set of JS Schema tools

- A basic JS object schema framework
- A simple JSON-based human-readable, human-editable document store with schema support
- A JS differ that allows for three-way diffs (e.g. applying schema1 → schema2 transforms to _instances_ of schema1, to make them schema2-conformant).
- An `equals(o1, o2)` function that allows for both strict and coerced equality testing.

## Schema API

`loadSchema(path)`

`validate(schema, object, strict = true)`

`createValidator(schema, strict = true)`

`migrate(object, schema1, schema1)`

`migrate(object, migration_operations)`


## JSON Store API

`store` / `new Store()` / `new JSONDataStore()`

`load(namespace, schema)`

`migrate(newschema)`

`view(primaryKey)`

`get(key)`

`put(key)`

`remove(key)`


## Diff API

`create(object1, object2)` / `createDiff(object1, object2)`

`apply(diff, object)` / `applyDiff(diff, object)`

`makeChangeHandler(ignoreKey, filterKeyString)`

## Equals API

`equals(o1, o2, strict = true)`
