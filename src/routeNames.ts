export const routeNames = {
  root: "/",
  signIn: "/log-in",
  signUp: "/sign-up",
  dashboard: "/dashboard",
  about: "/about",
  account: "/account",
  register: "/register",
  passwordReset: "/password-reset",
  passwordResetAuthorized: "/password-reset/authorized",
  campaign: (id: number) => `/dashboard/campaign/${id}`,
  campaignAnalytics: (id: number) => `/dashboard/campaign/${id}/analytics`,
} as const;
