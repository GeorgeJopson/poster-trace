export const routeNames = {
  signIn: "/log-in",
  signUp: "/sign-up",
  dashboard: "/dashboard",
  about: "/about",
  account: "/account",
  register: "/register",
  campaign: (id: number) => `/dashboard/campaign/${id}`,
  campaignAnalytics: (id: number) => `/dashboard/campaign/${id}/analytics`,
} as const;
