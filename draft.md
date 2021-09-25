# Model/schema (dot js)



"There are a million JS schema libraries for data validation. There is only one library that lets you perform automatic data migration when your schemas change."

We've all been there: you're creating an API, or you have some data model requirement, and so you grab yourself a data validation JS library so you can send JSON back and forth and everything's going well, and then the requirements change. Properties in your JSON are now in the wrong place, entire subtrees of values that should be there, aren't there, and you're looking at your code going "Guess it's time to make a v2 of this API".

Which is super annoying, because over in Python land you know folks are using Django, and all they have to do is run `makemigrations` followed by `migrate` and boom, done, their data's back in sync with their models. Why doesn't JS have that?

Well: it does. It's this. Model/schema (dot js).

All you should need to care about is writing easy to read, easy to maintain models that your code can work with. We're using computers for crying out loud, this is a solved problem.

## How do I get started?

It all starts with simply defining your data model. This means writing a JS class that extends `Model`, and making sure its fields are encoded using `Models.field`. For instance, let's say we want to work with user data: let's write a `User` model.

```js
import { Model, Models } from "model-schema-js";

// Create a custom model that extends Model
const User extends Model {
  __meta = {
    // metadata is the lifeblood of any properly managed model
    description: `a user model`,
    distinct: true,
    filename: `name`,
  }

  // And then we define the fields that this model should have,
  // knowing that data validation will get taken care of
  // automatically as long as we define it using Models.field types.

  name = Models.fields.string({
    required: true,
  });

  password = Models.fields.string({
    required: true
  });

  nickname = Models.fields.string();
}
```



We can now work with this model knowing that:

1. our data will always be valid
2. we can save and load our data as needed



For example, let's imagine we're running an Express server and we want to register a new user:

```js
import express from "express";
const app = express()

// set up a static dir
app.use(express.static(`./public`));

// Then load our user model, and universally save/load data from
// a directory expressly NOT accessible to web requests:
import { User } from "./our-user-model.js";
import { Models } from "model-schema-js";
Models.setStorePath(`./json-data-store`);

// Middleware: ensure we have a valid username/password to work with
function verifyUserPass(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new Error(`missing username or password`));
  }
}

// The important middleware: create a new user
function createUser(req, res, next) {
  const { username, password } = req.body;

  try {
    const user = User.create({ name: username, password });
    user.save();
    req.user = user;
    next();
  } catch (err) { next(err); }
}

app.post(`/register`, verifyUserPass, createUser, (req, res) => {
  res.render(`registered.html`, {
    username: req.user.name
  });
})
```

And then imagine we want the user to have the freedom to change their nickname:

```js
import { validPassword } from "./my-security-suite.js";

function authenticate(req, res, next) {
  try {
    req.user = User.load(req.body.username);
    if (!validPassword(req.user, req.body.password)) {
      throw new Error(`Authentication failed`);
    }
    next();
  } catch (err) { next(err); }
}

function handleUpdates(req, res, next) {
  try {
    const { user } = req;
    user.nickname = req.body;
    user.save();
    next();
  } catch (err) { next(err); }
}

app.put(`/profile`, authenticate, handleUpdates, (req, res) => {
  res.render(`user_profile.html`, {
    user: req.user
  });
})
```

And that's all.

Our code just sets their nickname, and then save the user model. Assigning a value makes model validation kick in, and the code will throw an error if the value does not pass validation. You don't need to write any `validate(...)` code, simply assigning the value causes validation to kick in before allowing the assignment to go through.



## So let's change our model


const me = MyModel.create({
    name: "it's my name",
    nickname: "nick",
});

me.name = "a new name";
me.save();

const meAgain = MyModel.load(`me`);