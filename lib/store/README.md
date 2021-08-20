# A simple JSON document store, with optional schema backing.

This is a simple JSON document store, with namespace-directories, and optional schema backing for objects.

## `store` / `new Store()` / `new JSONDataStore()`

The library exports three things:

- `store` a prebuilt document store that you can immediately start using.
- `Store` a class that can be instantiate to create JSON data store instances.
- `JSONDataStore` technically the real class, but it's a bit of a mouthful, and `Store` is much easier.

## `new Store(dataPath)`

Creates a new `Store`, housing its files in `./json-data-store/dataPath`. Note that you have no control over the `./json-data-store` part, all data relating to the JSON data store will be located in this single dir. Don't expose this dir in your Express server. Add this dir to your `.gitignore` and/or `.npmignore`. Etc.

# The Store API

The following functions are available on the `store` variable, as well as on `new Store()` instances.

## `load(namespace, schema?)`

Allocates a directory for the provided namespace, with optional schema-binding to ensure that any data written to and read from this dir conforms to the indicated schema.

## `migrate(newschema)`

If `load`ed, stored data in a namespace can be migrated from one schema to another, if needed. This does that.

## `view(primaryKey)`

This creates a derivative "virtual store" that only works for a specific primary key. Given that primary keys map to individual files, this means that you can create derivative stores that will only work with (or mess up) single files in your data store.

## `get(key)`

Get a value from the store.

Note that `key` may be a dot-separated nested key, so if you want to access `main.secondary` in the `principal` file, you can use `get("principal.main.secondary")` and this will return _only_ that property's value.

## `put(key, value)`

Set or update a value in the store.

Note that `key` may be a dot-separated nested key, so if you want to set/update `main.secondary` in the `principal` file, you can use `put("principal.main.secondary", value)` and this will set/update _only_ that property's value.

## `remove(key)`

Remove a key from the store.

Note that `key` may be a dot-separated nested key, so if you want to set/update `main.secondary` in the `principal` file, you can use `put("principal.main.secondary", value)` and this will set/update _only_ that property's value.

If the key _is_ a primary key, this will delete the associated `.json` file from the store.
