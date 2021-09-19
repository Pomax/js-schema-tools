import { User } from "../../../test/user.model.2.js";
import { fromSchemaToData } from "../model-store.js";

const user = new User();
fromSchemaToData(user);
console.log(JSON.stringify(user, false, 2));

const test = {
  stats: {
    __meta: {
      description: "Player statistics, maintained by the game system",
      required: true,
    },
    shape: {
      games: {
        __meta: {
          description: "Game-related statistics",
          configurable: false,
        },
        shape: {
          created: {
            __meta: {
              required: true,
            },
            type: "number",
            default: 0,
          },
          played: {
            __meta: {
              required: true,
            },
            type: "number",
            default: 0,
          },
          aborted: {
            __meta: {
              required: true,
            },
            type: "number",
            default: 0,
          },
          won: {
            __meta: {
              required: true,
            },
            type: "number",
            default: 0,
          },
          lost: {
            __meta: {
              required: true,
            },
            type: "number",
            default: 0,
          },
        },
      },
    },
  },
};

fromSchemaToData(test);
console.log(JSON.stringify(test, false, 2));
