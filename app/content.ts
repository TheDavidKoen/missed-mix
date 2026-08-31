export const SITE = {
  name: "Missed Mix",
  description: "Find people whose music taste lines up with yours, then send them a vibration.",
} as const;

export const LANDING = {
  headline: "Someone out there has your playlist.",
  standfirst:
    "Missed Mix matches people on what they listen to. Build a profile, find the overlap, send a vibration.",
  steps: [
    {
      title: "Build a profile",
      body: "A short bio, a picture, and the artists you actually listen to.",
      detail:
        "You pick the artists and tracks yourself, so matching runs on what you chose rather than on whatever could be scraped from your listening history. Share as much or as little else as you want to.",
    },
    {
      title: "Find your overlap",
      body: "Missed Mix scores every profile against your taste and ranks the closest.",
      detail:
        "Scoring runs on shared artists and the genres behind them, so two people who never picked the same act can still land near each other. You see what you have in common before deciding whether to reach out.",
    },
    {
      title: "Send a vibration",
      body: "A quiet nudge. Accept one and a private conversation opens.",
      detail:
        "A vibration is a nudge, not a message. Whoever receives it reads your profile and decides. Nothing opens until they accept, and either of you can walk away without a conversation ever starting.",
    },
  ],
} as const;

export const AUTH = {
  login: {
    title: "Log in",
    heading: "Log in to Missed Mix",
    prompt: "Not on Missed Mix yet?",
    switchLabel: "Sign up",
    switchTo: "/register",
  },
  register: {
    title: "Sign up",
    heading: "Sign up for Missed Mix",
    prompt: "Already have an account?",
    switchLabel: "Log in",
    switchTo: "/login",
  },
  disclosure:
    "Missed Mix never sees a password. You sign in with Google or Discord, and we store only your provider ID, your email address, and the profile you choose to fill in.",
  providers: {
    google: "Continue with Google",
    discord: "Continue with Discord",
  },
} as const;
