import { JSDOM } from "jsdom";
import { User } from "../models/user.model.js";

describe(`Testing form generation from models`, () => {
  let user = undefined;
  let document = undefined;

  beforeAll(() => {
    user = User.create({
      profile: {
        name: `username`,
        password: `password`,
        preferences: {
          avatar: `test.png`,
        },
      },
    });
    const HTML = user.toHTMLForm();
    document = new JSDOM(HTML).window.document;
  });

  // ╔══════════════════════╗
  // ║ THE TESTS START HERE ║
  // ╚══════════════════════╝

  test(`Can create HTML user form`, () => {
    const avatar = document.getElementById(`profile.preferences.avatar`);
    expect(avatar).not.toBeNull();
    expect(avatar.value).toBe(`test.png`);

    const allow_chat = document.getElementById(
      `profile.preferences.config.allow_chat`
    );
    expect(allow_chat).not.toBeNull();
    expect(allow_chat.checked).toBe(true);
  });

  // test(`Can create HTML user form table`, () => {
  //   const HTML = user.toHTMLTable();
  //   const { document } = new JSDOM(HTML).window;
  //   const avatar = document.getElementById(`profile.preferences.avatar`);
  //   console.log(avatar);
  // });
});
