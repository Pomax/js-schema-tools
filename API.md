# Schema API

`loadSchema(path)`

`validate(schema, object, strict = true)`

`createValidator(schema, strict = true)`

`makeMigration(schema1, schema2)`

`migrate(object, operations)`

`migrate(object, schema1, schema2)`

# JSON Store API

`store` / `new JSONDataStore()`

`load(namespace, schema)`

`view(primaryKey)`

`get(key)`

`put(key)`

`remove(key)`

# Diff API

`create` / `createDiff`

`apply` / `applyDiff`
