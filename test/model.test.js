import fs from "fs";
import path from "path";
import { Models } from "../index.js";
import { User } from "./user.models.js";

/**
 * Our battery of User tests
 */
describe(`Testing User model`, () => {
  const keepFiles = process.argv.includes(`--keep`);

  const testData = {
    admin: true,
    profile: {
      name: `TestUser`,
      password: `TestUser`,
      preferences: {
        avatar: `test-user.png`,
        config: {
          allow_chat: false,
          end_of_hand_timeout: 2147483647,
          hand_start_timeout: 0,
          play_once_ready: true,
          rotate_on_draw: false,
          rotate_on_east_win: false,
        },
        layout: `stacked`,
      },
    },
  };

  let user;

  /**
   * Before we start the tests, set up a store path, and register our User
   * model so that the on-disk schema file(s) exist when the tests run.
   */
  beforeAll(() => {
    // determine our store path
    const moduleURL = new URL(import.meta.url);
    const moduleDir = path.dirname(
      moduleURL.href.replace(
        `file:///`,
        process.platform === `win32` ? `` : `/`
      )
    );
    const storePath = `${moduleDir}/store`;
    fs.mkdirSync(storePath, { recursive: true });
    Models.setStorePath(storePath);
    Models.register(User);
  });

  /**
   * Load our test user "afresh" before every test.
   */
  beforeEach(() => {
    try {
      user = User.load(`TestUser`);
    } catch (e) {
      // this will fail for the first test, which builds this record.
    }
  });

  /**
   * Clean up the data store, unless the tests were run with
   * the `--keep` flag passed, to preserve the data store.
   */
  afterAll(() => {
    if (keepFiles) return;
    fs.rmSync(Models.storePath, { recursive: true });
  });

  // THE TESTS START HERE

  test(`Can create user TestUser`, () => {
    expect(() => {
      const user = User.create(testData);
      user.save();
    }).not.toThrow();
  });

  test(`User "TestUser" loads from file`, () => {
    expect(user).toBeDefined();
    expect(user.profile.preferences.config.end_of_hand_timeout).toBe(
      testData.profile.preferences.config.end_of_hand_timeout
    );
    const json = user.toString();
    expect(json).toBeDefined();
  });

  test(`Toggle "config.allow_chat" is permitted`, () => {
    const val = user.profile.preferences.config.allow_chat;
    expect(() => {
      user.profile.preferences.config.allow_chat = !val;
    }).not.toThrow();
  });

  test(`Saving user to file after changing value works`, () => {
    let val = !user.profile.preferences.config.allow_chat;

    expect(() => {
      user.profile.preferences.config.allow_chat = val;
      user.save();
    }).not.toThrow();

    user = User.load(`TestUser`);
    expect(user.profile.preferences.config.allow_chat).toBe(val);
  });

  test(`Setting values from flat objects works`, () => {
    expect(() => {
      user.updateFromSubmission({
        "profile.name": user.profile.name.toUpperCase(),
        "profile.password": user.profile.password.toUpperCase(),
        "profile.preferences.config.allow_chat": "true",
        "profile.preferences.config.end_of_hand_timeout": "10000",
        "profile.preferences.config.seat_rotation": "-1",
        "profile.preferences.layout": "traditional",
      });
    }).not.toThrow();
    expect(user.profile.preferences.config.end_of_hand_timeout).toBe(10000);
  });

  test(`Assigning subtrees works`, () => {
    expect(() => {
      user.profile = {
        name: user.profile.name.toLowerCase(),
        password: user.profile.password.toLowerCase(),
        preferences: {
          config: {
            allow_chat: false,
            end_of_hand_timeout: 100,
            seat_rotation: 1,
          },
          layout: `stacked`,
        },
      };
    }).not.toThrow();
  });

  test(`Setting "config.player_count" to false is a validation error`, () => {
    expect(() => {
      user.profile.preferences.config.player_count = false;
    }).toThrow(`Could not assign key "player_count" value "false".`);
  });

  test(`Assigning bad subtrees throws`, () => {
    try {
      user.profile = {
        // missing name and password fields
        preferences: {
          config: {
            allow_chat: `test`, // also, this field has to be a boolean
          },
        },
      };
    } catch (e) {
      expect(e.errors).toStrictEqual([
        `name: required field missing.`,
        `password: required field missing.`,
        `preferences.config.allow_chat: value is not a valid boolean.`,
      ]);
    }
  });

  test(`Cannot create without initial data if there are required fields`, () => {
    try {
      User.create();
    } catch (e) {
      expect(e.errors).toStrictEqual([
        `profile.name: required field missing.`,
        `profile.password: required field missing.`,
      ]);
    }
  });

  test(`Cannot create with initial data that is missing required fields`, () => {
    try {
      User.create({
        profile: {
          password: `hake`,
        },
      });
    } catch (e) {
      expect(e.errors).toStrictEqual([`profile.name: required field missing.`]);
    }
  });
});
