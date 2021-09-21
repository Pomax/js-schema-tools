# Model/schema dot js

IF you've ever wished you could work with JS objects that had built-in data validation, then this is the solution for you.

1. Models

2. Schema

```
import { Model, Models } from "../lib/models/models.js";
Models.setStoreLocation(`./model-schema-store`);

const MyModel extends Model {
  __meta = {
    description: "my model",
    distinct: true,
    filename: `name`,
  }

  name = Models.fields.string({ required: true, default: `` });
  nickname = Models.fields.string();
}

const me = MyModel.create({
  name: "it's my name",
  nickname: "nick",
});

me.name = "a new name";
me.save();

const meAgain = MyModel.load(`me`);

```
