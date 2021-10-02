import { Models } from "../../index.js";
import { User } from "./user.model.js";

/**
 * Our battery of User tests
 */

describe(`Testing User model without store backing`, () => {
  const testData = {
    profile: {
      name: `test`,
      password: `dace`,
    },
  };

  beforeAll(async () => {
    Models.resetRegistrations();
    Models.setStore(undefined);
  });

  test(`Can create User model without a store backing`, () => {
    const user = User.create(testData);
    expect(user.profile.name).toBe(testData.profile.name);
    expect(user.profile.password).toBe(testData.profile.password);
  });

  test(`Submodels work as standalone models`, () => {
    const user = User.create(testData);
    expect(user.toHTMLTable().slice(0, 6)).toBe(`<table`);
    expect(user.profile.toHTMLTable().slice(0, 6)).toBe(`<table`);
  });
});
