import { User } from "./user.models.js";

// Figure out where the test store dir can be found based on the module "url"
import path from "path";
const moduleURL = new URL(import.meta.url);
const moduleDir = path.dirname(
  moduleURL.href.replace(`file:///`, process.platform === `win32` ? `` : `/`)
);

// Right: let's try to load our model "from" a data file.

const user = User.load(`TestUser`, `${moduleDir}/store`);
console.log(user.toString());

// Next, a legal change to allow_chat, which is a Models.boolean:

try {
  const val = user.profile.preferences.config.allow_chat;
  user.profile.preferences.config.allow_chat = !val;
} catch (e) {
  console.error(e);
}

// Then, an illegal change to player_count, which must be one of [2, 3, 4]:

try {
  user.profile.preferences.config.player_count = false;
} catch (e) {
  console.error(e);
}

// And then let's save our model, which should update the file we originally loaded.
user.save();

// Also, let's try an update to the model based on the kind of data that we'd
// get when generating an HTML form using user.toFormHTML() and then posting
// data using that, which generates a flat object as post payload with object
// property paths as keys, and all data encoded as string data.
user.updateFromSubmission({
  "profile.name": user.profile.name.toUpperCase(),
  "profile.password": user.profile.password.toUpperCase(),
  "profile.preferences.config.allow_chat": "true",
  "profile.preferences.config.end_of_hand_timeout": "10000",
  "profile.preferences.config.seat_rotation": "-1",
  "profile.preferences.layout": "traditional",
});

console.log(user.toString());
