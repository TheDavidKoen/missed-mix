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
      title: "See who else is here",
      body: "Everyone else on Missed Mix, and the six things they picked.",
      detail:
        "You see the six answers everyone else gave, side by side with your own. Read what somebody listens to and decide for yourself whether you want to reach out, rather than trusting a number that claims to know.",
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
    submit: "Log in",
    prompt: "Not on Missed Mix yet?",
    switchLabel: "Sign up",
    switchTo: "/register",
  },
  register: {
    title: "Sign up",
    heading: "Sign up for Missed Mix",
    submit: "Create account",
    prompt: "Already have an account?",
    switchLabel: "Log in",
    switchTo: "/login",
  },
  fields: {
    username: "Username",
    password: "Password",
  },
  passwordHint: "At least 10 characters.",
  demoNotice:
    "Missed Mix is a portfolio demonstration, not a real service. Accounts here are throwaway and everything in them is disposable. Never reuse a password you use anywhere else.",
} as const;

export const PROFILE = {
  heading: "Build your profile",
  firstName: "First name",
  description: "A quote that resonates with you",
  descriptionHint: "200 characters.",
  avatar: "Profile picture",
  avatarHint: "JPEG, PNG or WebP, up to 2 MB.",
  save: "Save profile",
  saved: "Profile saved.",
  featuredHeading: "Your two highlights",
  promptsHeading: "Four artists",
} as const;

export const PROMPTS = [
  { key: "childhood", kind: "artist", label: "An artist that reminds you of your childhood" },
  { key: "excited", kind: "artist", label: "An artist you listen to to get excited" },
  { key: "cloudy", kind: "artist", label: "An artist that helps you on your cloudy days" },
  { key: "work", kind: "artist", label: "An artist that gets you through work" },
  { key: "topAlbum", kind: "album", label: "A top 5 album of yours" },
  { key: "currentSong", kind: "track", label: "Most listened to song right now" },
] as const;

export type PickKey = (typeof PROMPTS)[number]["key"];

export const MIXERS = {
  heading: "Mixers",
  standfirst: "Everyone else on Missed Mix. Open a profile to see all six answers.",
  empty: "Nobody else has built a profile yet.",
  nowPlaying: "Listening to",
  noSong: "No song picked yet",
} as const;

export const VIBRATION = {
  send: "Send a vibration",
  prompt: "Send them a song",
  hint: "A vibration is a nudge with a song attached. They see it before deciding whether to reply.",
  submit: "Send it",
  sent: "Vibration sent.",
  already: "You have already sent this person a vibration.",
  needSong: "Pick a song first.",
  heading: "Vibrations",
  standfirst: "Nudges people have sent you, each with a song attached.",
  empty: "Nothing yet. Send one from Mixers and see who sends back.",
} as const;

export const NAV = [
  { to: "/profile", label: "My Profile" },
  { to: "/mixers", label: "Mixers" },
  { to: "/vibrations", label: "Vibrations" },
] as const;
