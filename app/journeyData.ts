import type { JourneyState, LovePathId, WeeklyTask } from "./journeyTypes";

export const lovePaths: {
  id: LovePathId;
  icon: string;
  title: string;
  text: string;
}[] = [
  {
    id: "words",
    icon: "💬",
    title: "מילים טובות",
    text: "חיזוק, תודה, הערכה, ברכה.",
  },
  {
    id: "time",
    icon: "🕰",
    title: "זמן יחד",
    text: "להיות נוכח, להקשיב, לשחק, ללכת יחד.",
  },
  {
    id: "help",
    icon: "🛠",
    title: "עזרה מעשית",
    text: "לשים לב לצורך ולעזור בלי לעשות עניין.",
  },
  {
    id: "touch",
    icon: "❤️",
    title: "קרבה ומגע בטוח",
    text: "חיבוק, יד על הכתף, חיוך, מבט רך, לפי מה שמתאים לילד.",
  },
  {
    id: "gesture",
    icon: "🎁",
    title: "מחווה קטנה",
    text: "פתק, משהו קטן שהכינו לו, לזכור מה חשוב לו.",
  },
];

export const meetings = [
  {
    number: 1,
    title: "מפגש ראשון — הרצון לתת",
    text: "רגע לימוד קצר, ואז בחירה במחווה קטנה שאפשר לנסות בבית.",
    action: "נכנסים למפגש",
  },
  {
    number: 2,
    title: "מפגש שני — איך הילד שלי מרגיש אהוב",
    text: "מתבוננים בעדינות בילד אחד או שניים, בלי תיוג ובלי אבחון.",
    action: "להתבוננות",
  },
  {
    number: 3,
    title: "מפגש שלישי — סיכום והמשכיות",
    text: "אוספים את מה שהתבהר ובוחרים צעד קטן להמשך השבוע.",
    action: "לסיכום המסע",
  },
];

const weekDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function createWeeklyTasks(): WeeklyTask[] {
  return weekDays.map((day, index) => ({
    id: `day-${index + 1}`,
    day,
    plannedAction: "",
    done: false,
    whatIDid: "",
    whatItDidToMe: "",
    whatINoticedAtHome: "",
  }));
}

export const initialJourneyState: JourneyState = {
  currentScreen: "welcome",
  weeklyTasks: createWeeklyTasks(),
  children: [],
  activeChildId: null,
  reflection: {
    howILove: "",
    howChildrenReceive: "",
    takeForward: "",
    weeklyCommitment: "",
  },
  personalSummary: "",
};
