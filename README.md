# Use Models For Data (dot JS)

- define a model to work with, using modern JS class syntax
- automatic schema-backing and validation

- tell the model manager which storage system to use (required)
- Either create new models, or load them from storage
- values are automatically validated during creation/assignment
- simple save mechanism (data is by definition valid, default values are not stored)

# Topics for this library

- defining models
    - class definitions
- constructing models
    - create default
    - create default even though that means missing required fields (allowIncomplete)
    - create from data
    - create from data even if it's missing required fields
    - loading from astore
- using models
    - get/set values
    - get/set subtrees
    - toString (formatted JSON without defaults)
    - valueOf (fully qualified plain object)
    - reset([data])
- using models in the browser
    - HTML form/table
    - (P)React form/table
    - Custom trees
- redefining models
    - using a data store
    - schema change detection
    - data migrations


# Basic use

```js
import { Models } from "use-models-for-data";
import { MyDataModel } from "./my-data-model.js";
Models.useDefaultStore(`./data-store`);

const model = MyDataModel.from({
    count: 0,
    name: `My name`,
    address: {
        street: `First street`,
        number: 1334,
        city: `My City`
    }
});

model.save();
```

This will write a file `./data-store/My data model/My name.json` to disk, with only non-default values saved:

```json
{
    "name": "My name",
    "address": {
        "street": "First street",
        "number": 1334,
        "city": "My City"
    }
}
```


```js
import { Model, Fields } from "use-models-for-data";

export class MyDataModel extends Model {
    __meta = {
        name: `My data model`,
        distinct: true,
        recordkey: (record) => record.name,
    };

    count = Fields.number({ default: 0 });
    name = Fields.string({ required: true, default: "some string "});
    address = Fields.model(new Address());
}

import someCityList from "./my-city-list.js";

class Address extends Model {
    __meta = {
        name: `A simplified address model`,
    };

    street = Fields.string({
        validate: (value) => {
            // throw error if value is not a valid street
        },
    });

    number = Fields.number({ required: true });

    city = Fields.string({
        required: true,
        choices: someCityList,
    });
}
```

## Field types

## Saving and loading

## Dealing with model changes

