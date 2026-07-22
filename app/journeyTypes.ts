export type LovePathId = "words" | "time" | "help" | "touch" | "gesture";

export type JourneyScreen =
  | "welcome"
  | "home"
  | "meeting1"
  | "weekly"
  | "meeting2"
  | "childForm"
  | "childCard"
  | "meeting3"
  | "personalSummary";

export type WeeklyTask = {
  id: string;
  day: string;
  plannedAction: string;
  done: boolean;
  whatIDid: string;
  whatItDidToMe: string;
  whatINoticedAtHome: string;
};

export type ChildProfile = {
  id: string;
  name: string;
  age: string;
  happy: string;
  whenOpens: string;
  feelsSeen: string;
  hardToReceive: string;
  opensThrough: LovePathId | "";
  weeklyAction: string;
};

export type JourneyReflection = {
  howILove: string;
  howChildrenReceive: string;
  takeForward: string;
  weeklyCommitment: string;
};

export type JourneyState = {
  currentScreen: JourneyScreen;
  weeklyTasks: WeeklyTask[];
  children: ChildProfile[];
  activeChildId: string | null;
  reflection: JourneyReflection;
  personalSummary: string;
};
