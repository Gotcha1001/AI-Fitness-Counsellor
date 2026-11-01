/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as checkIns from "../checkIns.js";
import type * as coach from "../coach.js";
import type * as lib_appearance from "../lib/appearance.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_nutrition from "../lib/nutrition.js";
import type * as lib_openrouter from "../lib/openrouter.js";
import type * as lib_parsePlan from "../lib/parsePlan.js";
import type * as lib_schedule from "../lib/schedule.js";
import type * as lib_validators from "../lib/validators.js";
import type * as plans from "../plans.js";
import type * as profiles from "../profiles.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  checkIns: typeof checkIns;
  coach: typeof coach;
  "lib/appearance": typeof lib_appearance;
  "lib/auth": typeof lib_auth;
  "lib/nutrition": typeof lib_nutrition;
  "lib/openrouter": typeof lib_openrouter;
  "lib/parsePlan": typeof lib_parsePlan;
  "lib/schedule": typeof lib_schedule;
  "lib/validators": typeof lib_validators;
  plans: typeof plans;
  profiles: typeof profiles;
  user: typeof user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
