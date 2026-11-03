import { ValidationError } from "../shared/ValidationError";

/**
 * A user's id. Users belong to Better Auth, which assigns their ids, so there's
 * no `generate`: the domain only refers to users.
 */
export type UserId = string & { readonly __brand: "UserId" };
export const UserId = {
  from(value: string): UserId {
    if (value === "") throw new ValidationError("Invalid user id");
    return value as UserId;
  },
};
