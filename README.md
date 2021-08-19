# A basic JS schema

This is basic schema library for JS object, allowing one to write a schema that JS objects need to conform to, with functions to validate an object to a schema (either strict, or with coercion allowed), as well as building forms (in plain HTML as well as arbitrary frameworks like (P)React) to modify objects in a schema-compliant fashion.

A schema has the following form:

```js
{
    __meta: [metadata],
    property1: [property-schema],
    property2: [property-schema],
    ...
}
```

## metadata

The `metadata` definition is an object of the form:

```js
{
    name: [string],
    id: [string],
    required: [boolean],
    configurable: [boolean],
    debug: [boolean],
    validate_as: [validator name string],
    schema: [relative path string],
}
```
Except for `name` and `id`, all values are optional, as is the `__meta` property itself.

Additionally, any number of custom properties are allowed inside the __meta object, because it's a convenient place to house application-specific metadata for your objects.

### metadata properties

If **`required`** is true, validation/conformance will fail if this field is missing from an instance object.

If **`configurable`** is false, forms that are generated based on this schema will not include this property.

If **`debug`** is true, the form building functions will omit this property from the form, unless the build function's options includes a `skipDebug: false` flag.

If **`schema`** exists, there should be no keys other than `__meta` for this property. The shape for this property's subtree is instead defined in a separate schema file.


>> If **`validate_as`** is specified, more specific validation is performed on a field.
>> NOTE THAT THIS FUNCTIONALITY HAS NOT YET BEEN IMPLEMENTED


## property schema

The `property-schema` for properties take several forms. All property schema are of the form:

```js
{
    __meta: [metadata]
}
```

but depending on the property type modelled, the rest of the property schema differs.

### primitives

For primitive values, the rest of the schema has the following form:

```js
{
    type: [boolean|number|string],
    default: [type-appropriate default value]
}
```

### arrays

For properties that can be "one of ..." (i.e. an array of values) a `choices` list is used rather than a `type`:

```js
{
    choices: [array of possible values],
    default: [one of the possible value]
}
```

### objects

Properties that represent objects specify a `shape`, which takes the form of an embedded schema:

```js
{
    shape: [schema]
}
```
For embedded schema, the `__meta.name` and `__meta.id` values are not required.

## Validation

TEXT GOES HERE, INCLUDE COERCION FLAG

## Form building

TEXT GOES HERE, EXPLAIN TREE GENERATION USING `create:...`, AND BUILT IN PLAIN HTML + DOM


## Schema examples

Let's look at a simple user schema:

```js
{
  __meta: {
    name: "users",
    id: "v1",
    description: "A user data schema"
  },
  name: {
    __meta: {
      required: true,
      configurable: false
    },
    type: "string"
  },
  password: {
    __meta: {
      required: true,
      configurable: false
    },
    type: "string"
  },
  profile: {
    __meta: {
      description: "This user's profile on the website",
      required: true
    },
    shape: {
      avatar: {
        __meta: {
          description: "A picture that identifies this user",
          validate_as: "filename"
        },
        type: "string"
      },
      bio: {
        __meta: {
          description: "User bio"
        },
        type: "string"
      },
      games_played: {
        __meta: {
          description: "How many games has this used played?",
          configurable: false
        },
        type: "number",
        default: 0
      }
    }
  },
  preferences: {
    __meta: {
      description: "Application preferences for this user"
    },
    shape: {
      defaultConfig: {
        __meta: {
          description: "The user's preferred default config",
          schema: "./config.json"
        }
      }
    }
  }
}
```

This relies on another schema stored in `config.json`, which houses the JSON representation of the following JS schema:

```js
{
  __meta: {
    name: "config",
    id: "v1",
    description: "Mahjong game configuration"
  },
  auto_start_on_join: {
    __meta: {
      description: "Immediately start a game when possible",
    },
    type: "boolean",
    default: true
  },
  force_open_play: {
    __meta: {
      description: "Force all players to play face-up.",
    },
    type: "boolean",
    default: false
  },
  game_mode: {
    __meta: {
      description: "What kind of game does this user prefer?",
    },
    choices: ["beginner", "normal", "expert"],
    default: "normal"
  },
  player_count: {
    __meta: {
      description: "The number of players in a game",
    },
    choices: [1, 2, 3, 4, 5, 6, 7, 8],
    default: 4
  },
  track_discards: {
    __meta: {
      description: "Track which discards were from which player",
    },
    type: "boolean",
    default: true
  },
  max_timeout: {
    __meta: {
      description: "The longest timeout that may be used in a game",
      configurable: false
    },
    type: "number",
    default: 2147483647
  }
}

```