export const SITE = {
  name: "Missed Mix",
  description: "Find people whose music taste lines up with yours, then send them a vibration.",
} as const;

export const LANDING = {
  headline: "Someone out there has your playlist.",
  standfirst:
    "Missed Mix matches people on what they listen to. Build a profile, send a vibration.",
  steps: [
    {
      title: "Build a profile",
      body: "Basic info and your favourite artists, albums and songs.",
      detail:
        "You pick the artists and tracks yourself. Share as much or as little as you want to.",
    },
    {
      title: "See who else is here",
      body: "Everyone else on Missed Mix, and their profiles.",
      detail:
        "Read what somebody listens to and decide for yourself whether you want to reach out.",
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
  disclosure:
    "Missed Mix is a portfolio demonstration, not a real service. Accounts here are throwaway and everything in them is disposable.",
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
  standfirst: "Everyone else on Missed Mix.",
  empty: "Nobody else has built a profile yet.",
  noSong: "No song picked yet",
} as const;

export const VIBRATION = {
  send: "Send a vibration",
  prompt: "",
  hint: "A vibration is a nudge with a song attached. They see it before deciding whether to reply.",
  submit: "Send vibe",
  sent: "Vibration sent.",
  already: "You have already sent this person a vibration.",
  needSong: "Pick a song first.",
  accept: "Accept vibration",
  acceptHint: "They sent you this song. Accepting opens a conversation between you.",
  accepted: "Accepted. Your conversation is open.",
  openChat: "Open conversation",
  heading: "Vibrations",
  standfirst: "Nudges people have sent you, each with a song attached.",
  empty: "Nothing yet. Send one from Mixers and see who sends back.",
  pendingHeading: "Waiting for you",
  openHeading: "Conversations",
  messagePlaceholder: "Write a message",
  messageSubmit: "Send",
} as const;

export const NAV = [
  { to: "/profile", label: "My Profile" },
  { to: "/mixers", label: "Mixers" },
  { to: "/vibrations", label: "Vibrations" },
] as const;

export type StackEntry = {
  layer: string;
  choice: string;
  logo: string | null;
  why: string;
  adr: string | null;
};

export const DOCK = {
  stackLabel: "Open the tech stack",
  stackTip: "Program's tech stack.",
  stackEyebrow: "Decisions, not defaults",
  stackHeading: "What Missed Mix runs on",
  close: "Close",
  siteLabel: "David Koen's portfolio",
  siteTip: "Back to my site.",
  siteHref: "https://davidkoen.is-a.dev",
} as const;

export const STACK: readonly StackEntry[] = [
  {
    layer: "Framework",
    choice: "React Router",
    logo: "/reactrouter.svg",
    why: "Pages are put together on the server and arrive as finished HTML, so they show up before any code has to download. Every form still works if that code never arrives at all.",
    adr: "0001-react-router-over-nextjs",
  },
  {
    layer: "Styling",
    choice: "Tailwind CSS",
    logo: "/tailwindcss.svg",
    why: "The styling framework I build with. Popular, well documented, and flexible.",
    adr: null,
  },
  {
    layer: "Database",
    choice: "MongoDB",
    logo: "/mongodb.svg",
    why: "Everything about a person lives in one record, so opening their profile is a single trip to the database rather than several stitched together.",
    adr: "0009-mongodb-atlas-over-d1",
  },
  {
    layer: "Validation",
    choice: "Zod",
    logo: "/zod.svg",
    why: "Nothing sent to this app is trusted until it has been checked against the shape it is supposed to be. That covers what you type, what is in the address bar, and what other companies' services send back.",
    adr: null,
  },
  {
    layer: "Hosting",
    choice: "Cloudflare Pages",
    logo: "/cloudflarepages.svg",
    why: "Where the app lives. On a network with machines worldwide, so it answers from somewhere near you rather than from one place.",
    adr: "0002-cloudflare-pages-over-workers",
  },
  {
    layer: "Language",
    choice: "TypeScript",
    logo: "/typescript.svg",
    why: "Everything here is written in TypeScript. It checks my work as I type, so a whole class of mistakes gets caught at my desk rather than on the live site.",
    adr: null,
  },
  {
    layer: "Quality gates",
    choice: "Automated checks",
    logo: "/lighthouse.svg",
    why: "Every change I make runs an automated review before it is allowed to go live: formatting, type errors, a Google Lighthouse speed audit, and a size limit that stops the build if this page ever gets too heavy.",
    adr: "0003-github-flow",
  },
];
