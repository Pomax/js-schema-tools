import { createDefault } from "../lib/schema/create-default.js";

const WALL_HACKS = [
  false,
  "self_drawn_win_clean",
  "self_drawn_win",
  "form_melded_kong_off_initial",
  "kong_in_initial_deal",
  "kong_from_first_discard",
  "robbing_a_kong",
  "robbing_a_selfdrawn_kong",
  "chow_by_player_1",
  "all_bonus_to_player",
  "thirteen_orphans",
  "all_green",
  "nine_gates",
  "little_three_dragons",
  "chow_for_player_0",
  "5_6_7_plus_5",
  "5_6_7_plus_6",
  "5_6_7_plus_7",
  "5_6_7_8_plus_6",
  "pung_chow_conflict",
  "cantonese_chicken_hand",
  "self_drawn_clean_pair_as_east",
];

const PRESETS = [
  "Cantonese",
  "Chinese Classical",
  "Chinese Classical for Bots",
];

const SAFE_32_BIT_VALUE = 2147483647;

const TIMEOUTS = [
  0,
  100,
  200,
  300,
  400,
  500,
  1000,
  2000,
  3000,
  4000,
  5000,
  10000,
  15000,
  30000,
  60000,
  3600000,
  SAFE_32_BIT_VALUE,
];

const config_schema = {
  __meta: {
    name: "config",
    version: 1,
    description: "Mahjong game configuration",
  },

  nested_property: {
    __meta: {
      description: "This is a nested property for testing purposes.",
    },
    shape: {
      name: {
        __meta: {
          description: "nested name",
        },
        choices: ["alice", "bob", "carol"],
        default: "alice",
      },
    },
  },

  movable_nested_property: {
    __meta: {
      description:
        "This is a nested property for testing purposes. We'll be moving this subtree into a new property",
      required: true,
    },
    shape: {
      nested_object: {
        __meta: {
          description: "nested object",
        },
        shape: {
          nested_value: {
            __meta: {
              description:
                "we'll be moving this whole subtree and then for fun, also change this property",
            },
            type: "string",
            default: "some value",
          },
        },
      },
    },
  },

  allow_chat: {
    __meta: {
      description:
        "Determines whether or not to allow players to use the chat function during a game.",
      icon: "💬",
    },
    type: "boolean",
    default: true,
  },

  auto_start_on_join: {
    __meta: {
      description: "Immediately start a game if the player_count is reached.",
      icon: "🟢",
    },
    type: "boolean",
    default: true,
  },

  bot_humanizing_delay: {
    __meta: {
      description:
        "The artificial delay between bots knowing what they want to do, and executing on that, to make humans feel like they're in a fair game.",
    },
    type: "number",
    choices: TIMEOUTS,
    default: 100,
  },

  end_of_hand_timeout: {
    __meta: {
      description:
        "Grace period between a win being declared and the score breakdown getting sent to all users.",
      icon: "⏱️",
    },
    choices: TIMEOUTS,
    default: 10000,
  },

  force_open_play: {
    __meta: {
      description:
        "Force all players to play with their tiles visible to all other players in the game.",
      icon: "🀅",
    },
    type: "boolean",
    default: false,
  },

  game_mode: {
    __meta: {
      description: "Indicate what kind of help we want human players to have.",
      icon: "💻",
    },
    type: "string",
    choices: ["beginner", "normal", "expert"],
    default: "normal",
  },

  game_start_timeout: {
    __meta: {
      description:
        "Grace period between all players joining and the game starting automatically.",
      icon: "⏱️",
    },
    choices: TIMEOUTS,
    default: 0,
  },

  hand_start_timeout: {
    __meta: {
      description:
        "Grace period between the initial deal and the first real play tile getting dealt.",
      icon: "⏱️",
    },
    choices: TIMEOUTS,
    default: 10000,
  },

  password: {
    __meta: {
      description:
        "String based lock for this game, so only people who have been given the password can join.",
      encrypted: true,
    },
    type: "string",
  },

  play_once_ready: {
    __meta: {
      description:
        "Don't start play until all users have indicated they are ready.",
      icon: "⏯️",
    },
    type: "boolean",
    default: false,
  },

  player_count: {
    __meta: {
      description: "The number of players in this game",
      icon: "👪",
    },
    type: "number",
    choices: [0, 2, 3, 4, 5, 6, 7, 8],
    default: 4,
  },

  randomize_seats: {
    __meta: {
      description:
        "if false, whoever made the game starts as east, with the other players seated based on join order.",
      icon: "❓",
    },
    type: "boolean",
    default: false,
  },

  rotate_on_draw: {
    __meta: {
      description: "Rotate the winds even when a draw occurs",
      icon: "🔄",
    },
    type: "boolean",
    default: true,
  },

  rotate_on_east_win: {
    __meta: {
      description: "Rotate the winds even when east wins",
      icon: "🔄",
    },
    type: "boolean",
    default: true,
  },

  ruleset: {
    __meta: {
      description: "The ruleset to use to score a game.",
      icon: "📜",
    },
    type: "string",
    choices: PRESETS,
    default: PRESETS[1],
  },

  seat_rotation: {
    __meta: {
      description:
        "either -1 (for [0]⇒[n]⇒[n-1]⇒...⇒[0] or 1 (for [0]⇒[1]⇒...⇒[n]⇒[0])",
      icon: "🔄",
    },
    type: "number",
    choices: [-1, 1],
    default: 1,
  },

  track_discards: {
    __meta: {
      description: "track which discards were from which player",
      icon: "👀",
    },
    type: "boolean",
    default: true,
  },

  use_single_player_timeouts: {
    __meta: {
      description:
        "if true, timeouts will be enforced even during a single-player game",
      icon: "⏱️",
    },
    type: "boolean",
    default: false,
  },

  wind_rotation: {
    __meta: {
      description: "either -1 (for 東⇒北⇒西⇒南) or 1 (for 東⇒南⇒西⇒北)",
      icon: "🔄",
    },
    type: "number",
    choices: [-1, 1],
    default: 1,
  },

  // ---debug---

  prng_seed: {
    __meta: {
      description:
        "pseudo-random number generation seed value. Set this to 0 in order for the PRNG to pick a random seed.",
      debug: true,
      required: true,
    },
    type: "number",
    default: 0,
  },

  wallhack: {
    __meta: {
      description:
        "Set up a very specific, predefined wall for testing the various aspects of play/scoring.",
      debug: true,
      required: true,
    },
    choices: WALL_HACKS,
    default: WALL_HACKS[0],
  },

  max_timeout: {
    __meta: {
      description:
        "max safe 32 bit signed int - roughly 25 year's worth of milliseconds",
      configurable: false,
      required: true,
    },
    type: "number",
    default: SAFE_32_BIT_VALUE,
  },
};

const default_config = createDefault(config_schema);

export { config_schema, default_config };
