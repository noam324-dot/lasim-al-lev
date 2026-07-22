"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { initialJourneyState, lovePaths, meetings } from "./journeyData";
import type {
  ChildProfile,
  JourneyReflection,
  JourneyScreen,
  JourneyState,
  LovePathId,
  WeeklyTask,
} from "./journeyTypes";
import { usePersistentState } from "./usePersistentState";

const storageKey = "darchei-haahava-parent-journey-v04";

const screenLabels: Record<JourneyScreen, string> = {
  welcome: "פתיחה",
  home: "לוח מסע",
  meeting1: "מפגש ראשון",
  weekly: "התנסות",
  meeting2: "מפגש שני",
  childForm: "כרטיס ילד",
  childCard: "כרטיס אהבה",
  meeting3: "מפגש שלישי",
  personalSummary: "סיכום אישי",
};

export default function JourneyApp() {
  const [journey, setJourney] = usePersistentState<JourneyState>(
    storageKey,
    initialJourneyState,
  );

  const activeChild =
    journey.children.find((child) => child.id === journey.activeChildId) ??
    journey.children[0] ??
    null;

  function goTo(screen: JourneyScreen) {
    setJourney((current) => ({ ...current, currentScreen: screen }));
  }

  function updateTask(taskId: string, patch: Partial<WeeklyTask>) {
    setJourney((current) => ({
      ...current,
      weeklyTasks: current.weeklyTasks.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task,
      ),
    }));
  }

  function saveChild(child: ChildProfile) {
    setJourney((current) => {
      const exists = current.children.some((item) => item.id === child.id);
      const children = exists
        ? current.children.map((item) => (item.id === child.id ? child : item))
        : [...current.children, child].slice(0, 2);

      return {
        ...current,
        children,
        activeChildId: child.id,
        currentScreen: "childCard",
      };
    });
  }

  function startChildForm(child?: ChildProfile) {
    setJourney((current) => ({
      ...current,
      activeChildId: child?.id ?? null,
      currentScreen: "childForm",
    }));
  }

  function updateReflection(patch: Partial<JourneyReflection>) {
    setJourney((current) => ({
      ...current,
      reflection: { ...current.reflection, ...patch },
    }));
  }

  function createSummary() {
    const childNames = journey.children
      .map((child) => child.name.trim())
      .filter(Boolean)
      .join(" ו");
    const summary = [
      "הסיכום האישי שלי במסע דרכי האהבה",
      "",
      journey.reflection.howILove &&
        `גיליתי על הדרך שבה אני אוהב: ${journey.reflection.howILove}`,
      journey.reflection.howChildrenReceive &&
        `גיליתי על ${childNames || "הילדים שלי"}: ${journey.reflection.howChildrenReceive}`,
      journey.reflection.takeForward &&
        `אני רוצה לקחת הלאה: ${journey.reflection.takeForward}`,
      journey.reflection.weeklyCommitment &&
        `השבוע אנסה: ${journey.reflection.weeklyCommitment}`,
    ]
      .filter(Boolean)
      .join("\n");

    setJourney((current) => ({
      ...current,
      personalSummary: summary,
      currentScreen: "personalSummary",
    }));
  }

  return (
    <main className="shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="app-panel">
        <header className="topbar">
          <button className="brand" type="button" onClick={() => goTo("home")}>
            <span className="brand-mark" aria-hidden="true" />
            <span>דרכי האהבה</span>
          </button>
          <div className="step-pill">{screenLabels[journey.currentScreen]}</div>
        </header>

        {journey.currentScreen === "welcome" && (
          <WelcomeScreen onStart={() => goTo("home")} />
        )}

        {journey.currentScreen === "home" && (
          <HomeScreen
            journey={journey}
            onOpen={(screen) => goTo(screen)}
            onReset={() => setJourney(initialJourneyState)}
          />
        )}

        {journey.currentScreen === "meeting1" && (
          <MeetingOneScreen
            onBack={() => goTo("home")}
            onWeekly={() => goTo("weekly")}
          />
        )}

        {journey.currentScreen === "weekly" && (
          <WeeklyScreen
            tasks={journey.weeklyTasks}
            onBack={() => goTo("meeting1")}
            onNext={() => goTo("meeting2")}
            onUpdate={updateTask}
          />
        )}

        {journey.currentScreen === "meeting2" && (
          <MeetingTwoScreen
            children={journey.children}
            onBack={() => goTo("home")}
            onNewChild={() => startChildForm()}
            onEditChild={startChildForm}
            onViewChild={(child) =>
              setJourney((current) => ({
                ...current,
                activeChildId: child.id,
                currentScreen: "childCard",
              }))
            }
            onNext={() => goTo("meeting3")}
          />
        )}

        {journey.currentScreen === "childForm" && (
          <ChildFormScreen
            child={activeChild}
            childCount={journey.children.length}
            onBack={() => goTo("meeting2")}
            onSave={saveChild}
          />
        )}

        {journey.currentScreen === "childCard" && activeChild && (
          <ChildLoveCardScreen
            child={activeChild}
            onBack={() => goTo("meeting2")}
            onEdit={() => startChildForm(activeChild)}
          />
        )}

        {journey.currentScreen === "meeting3" && (
          <MeetingThreeScreen
            reflection={journey.reflection}
            children={journey.children}
            onBack={() => goTo("home")}
            onChange={updateReflection}
            onCreateSummary={createSummary}
          />
        )}

        {journey.currentScreen === "personalSummary" && (
          <PersonalSummaryScreen
            summary={journey.personalSummary}
            onBack={() => goTo("meeting3")}
            onHome={() => goTo("home")}
          />
        )}
      </section>
    </main>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen-block app-welcome">
      <div className="welcome-heart" aria-hidden="true">
        ❤️
      </div>
      <div>
        <h1>דרכי האהבה</h1>
        <p className="lead-text">
          מסע קצר להורים שרוצים לאהוב לא רק בלב — אלא בדרך שהילד באמת מרגיש.
        </p>
      </div>
      <LovePathsCompact />
      <button className="primary-button" type="button" onClick={onStart}>
        מתחילים במסע
      </button>
      <div className="home-scene compact-scene" aria-label="בית ואור של בוקר">
        <div className="sun" />
        <div className="hills hill-back" />
        <div className="hills hill-front" />
        <div className="house">
          <div className="roof" />
          <div className="wall">
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({
  journey,
  onOpen,
  onReset,
}: {
  journey: JourneyState;
  onOpen: (screen: JourneyScreen) => void;
  onReset: () => void;
}) {
  const completedTasks = journey.weeklyTasks.filter((task) => task.done).length;

  return (
    <div className="screen-block">
      <div>
        <p className="eyebrow">מסע בשלושה מפגשים</p>
        <h2>לוח המסע שלי</h2>
        <p className="muted">
          בכל מפגש יש רעיון אחד, פעולה קטנה, ורגע קצר של התבוננות בבית.
        </p>
      </div>

      <div className="journey-progress" aria-label="התקדמות במסע">
        <span style={{ width: `${Math.min(100, (completedTasks / 7) * 34 + journey.children.length * 22)}%` }} />
      </div>

      <div className="meeting-grid">
        {meetings.map((meeting) => (
          <button
            className="meeting-card"
            key={meeting.number}
            type="button"
            onClick={() =>
              onOpen(
                meeting.number === 1
                  ? "meeting1"
                  : meeting.number === 2
                    ? "meeting2"
                    : "meeting3",
              )
            }
          >
            <span className="meeting-number">{meeting.number}</span>
            <strong>{meeting.title}</strong>
            <small>{meeting.text}</small>
            <b>{meeting.action}</b>
          </button>
        ))}
      </div>

      <div className="status-grid">
        <StatusCard label="משימות שבוצעו" value={`${completedTasks}/7`} />
        <StatusCard label="כרטיסי ילדים" value={`${journey.children.length}/2`} />
      </div>

      <button className="text-button" type="button" onClick={onReset}>
        איפוס המסע במכשיר הזה
      </button>
    </div>
  );
}

function MeetingOneScreen({
  onBack,
  onWeekly,
}: {
  onBack: () => void;
  onWeekly: () => void;
}) {
  return (
    <div className="screen-block">
      <ScreenHeader
        eyebrow="מפגש ראשון"
        title="הרצון לתת"
        text="מתחילים בשאלה פשוטה: איזו טובה קטנה יכולה להגיע באמת אל הלב של הילד שלי?"
      />
      <p className="next-step">עכשיו קוראים רעיון קצר, ואז בוחרים מחווה אחת לשבוע.</p>
      <article className="soft-card">
        <h3>אהבה כנתינה</h3>
        <p>
          אהבה איננה רק רגש חם שיש לי בלב. אהבה היא תנועה של נתינה: הרצון
          לצאת מעצמי, לראות את האחר, ולחפש מה באמת ייטיב איתו.
        </p>
      </article>
      <article className="soft-card">
        <h3>לשאול אחרת</h3>
        <p>
          לפעמים אני אוהב בדרך שנוחה לי, אבל הילד שלי צריך לקבל אהבה בדרך
          אחרת. דרכי האהבה עוזרות לי לשאול: איך האהבה שלי תגיע אליו באמת?
        </p>
      </article>
      <LovePathsCompact />
      <div className="footer-actions">
        <button className="ghost-button" type="button" onClick={onBack}>
          חזרה
        </button>
        <button className="primary-button" type="button" onClick={onWeekly}>
          להתנסות השבועית
        </button>
      </div>
    </div>
  );
}

function WeeklyScreen({
  tasks,
  onBack,
  onNext,
  onUpdate,
}: {
  tasks: WeeklyTask[];
  onBack: () => void;
  onNext: () => void;
  onUpdate: (taskId: string, patch: Partial<WeeklyTask>) => void;
}) {
  return (
    <div className="screen-block">
      <ScreenHeader
        eyebrow="התנסות שבועית"
        title="מחווה קטנה בבית"
        text="לא צריך למלא הכול. מספיק לבחור יום, לעשות משהו קטן, ולכתוב משפט אחד אם רוצים."
      />
      <p className="next-step">בחרו פעולה קטנה להיום. אחר כך אפשר לחזור ולסמן מה קרה.</p>
      <div className="task-list">
        {tasks.map((task) => (
          <article className={task.done ? "task-card done" : "task-card"} key={task.id}>
            <label className="task-check">
              <input
                checked={task.done}
                type="checkbox"
                onChange={(event) =>
                  onUpdate(task.id, { done: event.target.checked })
                }
              />
              <span>{task.day}</span>
            </label>
            <TextInput
              label="מה אנסה היום?"
              placeholder="למשל: לשבת איתו עשר דקות בלי טלפון"
              value={task.plannedAction}
              onChange={(value) => onUpdate(task.id, { plannedAction: value })}
            />
            <TextInput
              label="מה עשיתי בפועל?"
              placeholder="משפט קצר, רק אם מתאים"
              value={task.whatIDid}
              onChange={(value) => onUpdate(task.id, { whatIDid: value })}
            />
            <TextInput
              label="מה זה עשה לי?"
              placeholder="מה הרגשתי או שמתי לב אליו?"
              value={task.whatItDidToMe}
              onChange={(value) => onUpdate(task.id, { whatItDidToMe: value })}
            />
            <TextInput
              label="מה זה עשה בבית?"
              placeholder="אפילו שינוי קטן באווירה נחשב"
              value={task.whatINoticedAtHome}
              onChange={(value) =>
                onUpdate(task.id, { whatINoticedAtHome: value })
              }
            />
          </article>
        ))}
      </div>
      <div className="footer-actions">
        <button className="ghost-button" type="button" onClick={onBack}>
          חזרה
        </button>
        <button className="primary-button" type="button" onClick={onNext}>
          למפגש השני
        </button>
      </div>
    </div>
  );
}

function MeetingTwoScreen({
  children,
  onBack,
  onNewChild,
  onEditChild,
  onViewChild,
  onNext,
}: {
  children: ChildProfile[];
  onBack: () => void;
  onNewChild: () => void;
  onEditChild: (child: ChildProfile) => void;
  onViewChild: (child: ChildProfile) => void;
  onNext: () => void;
}) {
  return (
    <div className="screen-block">
      <ScreenHeader
        eyebrow="מפגש שני"
        title="להקשיב ללב של הילד"
        text="לא מחפשים להגדיר את הילד. רק לשים לב מה בדרך כלל עוזר לו להרגיש אהוב."
      />
      <p className="next-step">בחרו ילד אחד להתחיל איתו. אפשר להוסיף ילד נוסף בהמשך.</p>
      <div className="question-chip-grid">
        <span>מה משמח אותו?</span>
        <span>מתי הוא נפתח?</span>
        <span>מה גורם לו להרגיש שרואים אותו?</span>
            <span>איזו מחווה בדרך כלל מגיעה אליו?</span>
      </div>
      <div className="children-grid">
        {children.map((child) => (
          <article className="child-mini-card" key={child.id}>
            <strong>{child.name || "ילד ללא שם"}</strong>
            <span>{getLovePathTitle(child.opensThrough)}</span>
            <div className="inline-actions">
              <button type="button" onClick={() => onViewChild(child)}>
                כרטיס
              </button>
              <button type="button" onClick={() => onEditChild(child)}>
                עריכה
              </button>
            </div>
          </article>
        ))}
        {children.length < 2 && (
          <button className="add-child-card" type="button" onClick={onNewChild}>
            <span aria-hidden="true">＋</span>
            <strong>הוספת ילד</strong>
          </button>
        )}
      </div>
      <LovePathsCompact />
      <div className="footer-actions">
        <button className="ghost-button" type="button" onClick={onBack}>
          חזרה
        </button>
        <button className="primary-button" type="button" onClick={onNext}>
          למפגש השלישי
        </button>
      </div>
    </div>
  );
}

function ChildFormScreen({
  child,
  childCount,
  onBack,
  onSave,
}: {
  child: ChildProfile | null;
  childCount: number;
  onBack: () => void;
  onSave: (child: ChildProfile) => void;
}) {
  const emptyChild: ChildProfile = {
    id: `child-${Date.now()}`,
    name: "",
    age: "",
    happy: "",
    whenOpens: "",
    feelsSeen: "",
    hardToReceive: "",
    opensThrough: "",
    weeklyAction: "",
  };
  const [draft, setDraft] = usePersistentDraft(
    child ?? emptyChild,
  );
  const isNewBlocked = !child && childCount >= 2;

  return (
    <div className="screen-block">
      <ScreenHeader
        eyebrow="כרטיס ילד אישי"
        title="מה עוזר לו להרגיש אהוב?"
        text="עונים בעדינות לפי מה שכבר ראיתם בבית. אפשר להשאיר דברים פתוחים."
      />
      <p className="next-step">מלאו רק מה שאתם יודעים עכשיו. הכרטיס יכול להתבהר עם הזמן.</p>
      {isNewBlocked ? (
        <article className="soft-card">
          <p>בשלב הזה אפשר להוסיף עד שני ילדים.</p>
        </article>
      ) : (
        <article className="form-card">
          <TextInput
            label="שם הילד"
            placeholder="שם פרטי"
            value={draft.name}
            onChange={(value) => setDraft({ ...draft, name: value })}
          />
          <TextInput
            label="גיל, לא חובה"
            placeholder="אפשר להשאיר ריק"
            value={draft.age}
            onChange={(value) => setDraft({ ...draft, age: value })}
          />
          <TextArea
            label="מה בדרך כלל משמח אותו?"
            placeholder="משחק, שיחה, בדיחה, זמן לבד, עזרה..."
            value={draft.happy}
            onChange={(value) => setDraft({ ...draft, happy: value })}
          />
          <TextArea
            label="מתי הוא נפתח?"
            placeholder="באיזה זמן, מצב או סביבה קל לו יותר?"
            value={draft.whenOpens}
            onChange={(value) => setDraft({ ...draft, whenOpens: value })}
          />
          <TextArea
            label="מה גורם לו להרגיש שרואים אותו?"
            placeholder="מה גורם לו להרגיש שמישהו באמת שם לב אליו?"
            value={draft.feelsSeen}
            onChange={(value) => setDraft({ ...draft, feelsSeen: value })}
          />
          <TextArea
            label="מה קשה לו לקבל?"
            placeholder="לפעמים זו ביקורת, לחץ, מגע, הרבה שאלות..."
            value={draft.hardToReceive}
            onChange={(value) => setDraft({ ...draft, hardToReceive: value })}
          />
          <LovePathPicker
            value={draft.opensThrough}
            onChange={(value) => setDraft({ ...draft, opensThrough: value })}
          />
          <TextArea
            label="פעולה אחת שאנסה איתו השבוע"
            placeholder="משהו קטן, ברור, שאפשר באמת לעשות"
            value={draft.weeklyAction}
            onChange={(value) => setDraft({ ...draft, weeklyAction: value })}
          />
        </article>
      )}
      <div className="footer-actions">
        <button className="ghost-button" type="button" onClick={onBack}>
          חזרה
        </button>
        <button
          className="primary-button"
          disabled={isNewBlocked || !draft.name.trim()}
          type="button"
          onClick={() => onSave(draft)}
        >
          שמור כרטיס
        </button>
      </div>
    </div>
  );
}

function ChildLoveCardScreen({
  child,
  onBack,
  onEdit,
}: {
  child: ChildProfile;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="screen-block">
      <article className="child-love-card">
        <p className="eyebrow">כרטיס אהבה אישי</p>
        <h2>כרטיס האהבה של {child.name}</h2>
        <p className="card-note">זה לא סיכום סופי של הילד. זה פתק דרך קטן להורה אוהב.</p>
        {child.age && <span className="child-age">גיל {child.age}</span>}
        <div className="summary-lines">
          <SummaryLine label="משמח אותו" value={child.happy} />
          <SummaryLine label="מתי הוא נפתח" value={child.whenOpens} />
          <SummaryLine label="מרגיש שרואים אותו כש..." value={child.feelsSeen} />
          <SummaryLine label="קשה לו לקבל" value={child.hardToReceive} />
          <SummaryLine
            label="נראה שהוא נפתח דרך"
            value={getLovePathTitle(child.opensThrough)}
          />
          <SummaryLine label="אנסה השבוע" value={child.weeklyAction} />
        </div>
      </article>
      <div className="footer-actions">
        <button className="ghost-button" type="button" onClick={onBack}>
          חזרה
        </button>
        <button className="primary-button" type="button" onClick={onEdit}>
          עריכת הכרטיס
        </button>
      </div>
    </div>
  );
}

function MeetingThreeScreen({
  reflection,
  children,
  onBack,
  onChange,
  onCreateSummary,
}: {
  reflection: JourneyReflection;
  children: ChildProfile[];
  onBack: () => void;
  onChange: (patch: Partial<JourneyReflection>) => void;
  onCreateSummary: () => void;
}) {
  return (
    <div className="screen-block">
      <ScreenHeader
        eyebrow="מפגש שלישי"
        title="מה לוקחים הביתה"
        text="מסיימים לא עם רשימת מטלות, אלא עם נקודה אחת של בהירות וצעד קטן להמשך."
      />
      <p className="next-step">כתבו כמה מילים. מספיק משפט אחד בכל מקום.</p>
      <div className="children-recap">
        {children.map((child) => (
          <article className="child-mini-card" key={child.id}>
            <strong>{child.name}</strong>
            <span>{getLovePathTitle(child.opensThrough)}</span>
          </article>
        ))}
      </div>
      <article className="form-card">
        <TextArea
          label="מה גיליתי על הדרך שבה אני אוהב?"
          placeholder="משהו אחד שהתחדש לי"
          value={reflection.howILove}
          onChange={(value) => onChange({ howILove: value })}
        />
        <TextArea
          label="מה גיליתי על הדרך שבה הילדים שלי מקבלים אהבה?"
          placeholder="מה עוזר להם להרגיש שרואים אותם?"
          value={reflection.howChildrenReceive}
          onChange={(value) => onChange({ howChildrenReceive: value })}
        />
        <TextArea
          label="מה אני רוצה לקחת הלאה?"
          placeholder="מילה, כיוון או תזכורת לעצמי"
          value={reflection.takeForward}
          onChange={(value) => onChange({ takeForward: value })}
        />
        <TextArea
          label="פעולה אחת קטנה לשבוע הקרוב"
          placeholder="צעד קטן שאפשר להתחיל ממנו"
          value={reflection.weeklyCommitment}
          onChange={(value) => onChange({ weeklyCommitment: value })}
        />
      </article>
      <div className="footer-actions">
        <button className="ghost-button" type="button" onClick={onBack}>
          חזרה
        </button>
        <button className="primary-button" type="button" onClick={onCreateSummary}>
          צור לי סיכום אישי
        </button>
      </div>
    </div>
  );
}

function PersonalSummaryScreen({
  summary,
  onBack,
  onHome,
}: {
  summary: string;
  onBack: () => void;
  onHome: () => void;
}) {
  return (
    <div className="screen-block">
      <ScreenHeader
        eyebrow="סיכום אישי"
        title="יש לך כיוון להמשך"
        text="זה לא סוף המסע. זו תזכורת קטנה שאפשר לקחת אל הבית כבר השבוע."
      />
      <pre className="summary-box">{summary}</pre>
      <div className="footer-actions">
        <button className="ghost-button" type="button" onClick={onBack}>
          עריכה
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => navigator.clipboard?.writeText(summary)}
        >
          העתקה
        </button>
        <button className="primary-button" type="button" onClick={onHome}>
          ללוח המסע
        </button>
      </div>
    </div>
  );
}

function LovePathsCompact() {
  return (
    <div className="love-paths" aria-label="חמש דרכי האהבה">
      {lovePaths.map((path) => (
        <div className="love-path" key={path.id}>
          <span aria-hidden="true">{path.icon}</span>
          <div>
            <b>{path.title}</b>
            <small>{path.text}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function LovePathPicker({
  value,
  onChange,
}: {
  value: LovePathId | "";
  onChange: (value: LovePathId) => void;
}) {
  return (
    <fieldset className="path-picker">
      <legend>באיזו דרך אהבה נראה שהוא הכי נפתח?</legend>
      {lovePaths.map((path) => (
        <button
          className={value === path.id ? "path-option selected" : "path-option"}
          key={path.id}
          type="button"
          onClick={() => onChange(path.id)}
        >
          <span aria-hidden="true">{path.icon}</span>
          <b>{path.title}</b>
        </button>
      ))}
    </fieldset>
  );
}

function ScreenHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="muted">{text}</p>
    </div>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <textarea
        placeholder={placeholder}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <p>{value || "עוד לא מילאנו"}</p>
    </div>
  );
}

function getLovePathTitle(pathId: LovePathId | "") {
  return lovePaths.find((path) => path.id === pathId)?.title ?? "עוד בבירור";
}

function usePersistentDraft<T>(initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  return useState(initialValue);
}
