import { Models } from "../../index.js";
import { User } from "./user.model.js";

/**
 * Our battery of User tests
 */

describe(`Testing User model without store backing`, () => {
  beforeAll(async () => {
    Models.resetRegistrations();
    Models.setStore(undefined);
  });

  test(`Can create User model without a store backing`, () => {
    const data = {
      profile: {
        name: `test`,
        password: `dace`,
      },
    };
    const user = User.create(data);
    expect(user.profile.name).toBe(data.profile.name);
    expect(user.profile.password).toBe(data.profile.password);
  });
});
