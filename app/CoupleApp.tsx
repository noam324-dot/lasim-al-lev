"use client";

import { useMemo, useState } from "react";
import { usePersistentState } from "./usePersistentState";

type Round = "childSelf" | "parentGuess" | "parentSelf" | "childGuess";
type Category = "words" | "time" | "help" | "touch" | "gifts";
type Screen = "quiz" | "handoff" | "results" | "parentGestures" | "childGestures" | "finish";
type Choice = { category: Category; child: string; parent: string };
type Question = { id: string; options: [Choice, Choice] };
type Score = { id: Category; value: number };
type Idea = { key: string; category: Category; text: string };
type Answers = Partial<Record<Round, Record<string, Category>>>;
type State = {
  screen: Screen;
  round: Round;
  question: number;
  answers: Answers;
  results: Partial<Record<"childSelf" | "parentSelf", Score[]>>;
  parentGestures: string[];
  childGestures: string[];
  meetingDate: string | null;
};

const initialState: State = { screen: "quiz", round: "childSelf", question: 0, answers: {}, results: {}, parentGestures: [], childGestures: [], meetingDate: null };
const storageKey = "lasim-al-lev-family-v03";
const categories: Record<Category, { name: string; icon: string; description: string }> = {
  words: { name: "מילים טובות", icon: "💬", description: "מילים שמראות הערכה, עידוד וגאווה." },
  time: { name: "זמן יחד", icon: "🕰️", description: "נוכחות, הקשבה ורגעים שעושים ביחד." },
  help: { name: "עזרה ומעשים", icon: "🤲", description: "דברים קטנים שמקלים ואומרים: אני איתך." },
  touch: { name: "קרבה וחיבה", icon: "🤍", description: "חיבוק או קרבה, כשזה נעים ומתאים." },
  gifts: { name: "מחוות קטנות", icon: "🎁", description: "הפתעה או דבר קטן שנבחר במחשבה." },
};

function q(id: string, first: Choice, second: Choice): Question { return { id, options: [first, second] }; }
function c(category: Category, child: string, parent: string): Choice { return { category, child, parent }; }

const questions: Question[] = [
  q("q01", c("words", "שההורה יגיד לי: שמתי לב כמה התאמצת היום", "שתגידו לילד: שמתי לב כמה התאמצת היום"), c("time", "שנשב יחד עשר דקות ואספר מה עבר עליי", "שתשבו יחד עשר דקות והוא יספר מה עבר עליו")),
  q("q02", c("words", "לקבל הודעה קטנה מההורה: בהצלחה היום", "לקבל מכם הודעה קטנה: בהצלחה היום"), c("help", "שההורה יעזור לי לסדר משהו שמלחיץ אותי", "שתעזרו לילד לסדר משהו שמלחיץ אותו")),
  q("q03", c("words", "לשמוע מההורה משהו שהוא גאה בי עליו", "לשמוע מכם משהו שאתם גאים בו עליו"), c("touch", "לקבל חיבוק כשאני חוזר/ת הביתה, אם מתחשק לי", "לקבל מכם חיבוק כשחוזרים הביתה, אם מתחשק לו")),
  q("q04", c("words", "למצוא פתק קטן עם מילה טובה בתיק", "למצוא מכם פתק קטן עם מילה טובה בתיק"), c("gifts", "למצוא בתיק חטיף קטן שההורה בחר בשבילי", "למצוא בתיק חטיף קטן שבחרתם במיוחד")),
  q("q05", c("time", "לצאת יחד להליכה קצרה ולדבר", "לצאת איתכם להליכה קצרה ולדבר"), c("help", "שההורה יעזור לי להתכונן למחר", "שתעזרו לילד להתכונן למחר")),
  q("q06", c("time", "לבשל או להכין משהו יחד", "להכין איתכם משהו במטבח"), c("touch", "לשבת קרוב יחד בזמן שרואים משהו", "לשבת קרוב אליכם בזמן שרואים משהו, אם נעים לו")),
  q("q07", c("time", "שההורה יצטרף אליי למשחק שאני אוהב/ת", "שתצטרפו לילד למשחק שהוא אוהב"), c("gifts", "שההורה יפתיע אותי במשהו קטן שקשור למה שאני אוהב/ת", "שתפתיעו אותו במשהו קטן שקשור למה שהוא אוהב")),
  q("q08", c("help", "שההורה יכין לי משהו טעים אחרי יום עמוס", "שתכינו לילד משהו טעים אחרי יום עמוס"), c("touch", "לקבל יד על הכתף כשאני מספר/ת משהו קשה, אם מתאים לי", "לקבל מכם יד על הכתף כשמספר משהו קשה, אם מתאים לו")),
  q("q09", c("help", "שההורה יעשה איתי יחד מטלה שלא בא לי להתחיל", "שתעשו יחד מטלה שקשה לילד להתחיל"), c("gifts", "לקבל משהו קטן שההורה ראה וחשב עליי", "לקבל מכם משהו קטן שראיתם וחשבתם עליו")),
  q("q10", c("touch", "להתחיל את הבוקר בחיבוק, אם נעים לי", "להתחיל איתכם את הבוקר בחיבוק, אם נעים לו"), c("gifts", "לקבל הפתעה קטנה ליד ארוחת הבוקר", "לקבל מכם הפתעה קטנה ליד ארוחת הבוקר")),
  q("q11", c("time", "לנסוע יחד לסידור ולבחור את המוזיקה", "לנסוע איתכם לסידור ולבחור את המוזיקה"), c("words", "לשמוע: כיף לי להיות ההורה שלך", "לשמוע מכם: כיף לי להיות ההורה שלך")),
  q("q12", c("help", "שההורה יסדר בשבילי משהו שנשבר", "שתסדרו לילד משהו שנשבר"), c("words", "שההורה יגיד תודה על משהו שעשיתי בבית", "שתגידו לילד תודה על משהו שעשה בבית")),
  q("q13", c("touch", "לקבל כיף או חיבוק אחרי משהו שהצלחתי בו, אם מתאים לי", "לקבל מכם כיף או חיבוק אחרי הצלחה, אם מתאים לו"), c("words", "לשמוע: ידעתי שתצליח/י", "לשמוע מכם: ידעתי שתצליח/י")),
  q("q14", c("gifts", "לקבל תמונה שלנו שההורה הדפיס בשבילי", "לקבל מכם תמונה משותפת שהדפסתם בשבילו"), c("words", "לקבל הודעה שמספרת מה ההורה אוהב בי", "לקבל מכם הודעה שמספרת מה אתם אוהבים בו")),
  q("q15", c("help", "שההורה יעזור לי למצוא משהו שאיבדתי", "שתעזרו לילד למצוא משהו שאיבד"), c("time", "שההורה יעצור הכול ויקשיב לסיפור שלי עד הסוף", "שתעצרו הכול ותקשיבו לסיפור שלו עד הסוף")),
  q("q16", c("touch", "להחזיק ידיים בדרך, אם זה נעים לי", "להחזיק איתכם ידיים בדרך, אם זה נעים לו"), c("time", "לבחור יחד מה נעשה בשעה פנויה", "לבחור איתכם יחד מה תעשו בשעה פנויה")),
  q("q17", c("gifts", "לקבל מחברת או עט שההורה בחר במיוחד בשבילי", "לקבל מכם מחברת או עט שבחרתם במיוחד"), c("time", "לשתות יחד משהו ולדבר בלי טלפונים", "לשתות איתכם משהו ולדבר בלי טלפונים")),
  q("q18", c("touch", "לשבת צמוד להורה בזמן שמקריאים או מדברים, אם נעים לי", "לשבת צמוד אליכם בזמן קריאה או שיחה, אם נעים לו"), c("help", "שההורה יעזור לי לארגן את החדר לפני שמגיע חבר", "שתעזרו לילד לארגן את החדר לפני שמגיע חבר")),
  q("q19", c("gifts", "לקבל את המאכל האהוב עליי כהפתעה", "לקבל מכם את המאכל האהוב עליו כהפתעה"), c("help", "שההורה יוריד ממני מטלה אחת ביום עמוס", "שתורידו מהילד מטלה אחת ביום עמוס")),
  q("q20", c("gifts", "לקבל משהו קטן שההורה הכין בעצמו", "לקבל מכם משהו קטן שהכנתם בעצמכם"), c("touch", "לסיים את היום בחיבוק לילה טוב, אם מתאים לי", "לסיים איתכם את היום בחיבוק לילה טוב, אם מתאים לו")),
];

const parentLoveChoices: Record<Category, string[]> = {
  words: [
    "לשמוע ממך: אבא, אני אוהב אותך", "לשמוע ממך תודה על משהו שעשיתי בשבילך",
    "לקבל ממך הודעה קטנה שמאחלת לי יום טוב", "לשמוע ממך במה אתה גאה בי",
    "למצוא פתק קטן שכתבת לי", "לשמוע ממך: כיף לי להיות איתך",
    "לקבל ממך מחמאה אמיתית", "לשמוע ממך ששמת לב למשהו שעשיתי",
  ],
  time: [
    "לשבת איתך כמה דקות רק כדי להיות יחד", "שתשאל אותי באמת איך עבר עליי היום",
    "לצאת איתך להליכה קצרה", "לשתות איתך משהו בלי טלפונים",
    "שתצטרף אליי להכין משהו במטבח", "לשמוע ממך סיפור על היום שלך",
    "לעשות איתך סידור קטן בדרך", "שתבחר לבלות איתי כמה דקות פנויות",
  ],
  help: [
    "לראות שעזרת בבית כדי להקל עליי", "לגלות שעשית משהו בבית בלי שאבקש",
    "לקבל ממך כוס קפה או תה שהכנת בשבילי", "לראות ששמת לב שאני עייף והצעת לעזור",
    "שתעזור לי לסדר משהו קטן", "שתיקח על עצמך מטלה אחת ביום עמוס",
    "שתכין משהו קטן לקראת הארוחה", "לשמוע ממך: יש משהו שאני יכול לעזור בו?",
  ],
  touch: [
    "לקבל ממך חיבוק כשאנחנו נפגשים", "לשבת קרוב אליך בזמן שאנחנו מדברים",
    "לקבל ממך כיף אחרי משהו שהצליח לי", "שתשים יד על הכתף שלי ברגע נעים",
    "לקבל ממך חיבוק לילה טוב", "ללכת איתך יד ביד, אם זה נעים לשנינו",
    "לקבל ממך נשיקה או חיבוק לפני יום עמוס", "להרגיש שאתה מתקרב אליי כדי לומר שלום",
  ],
  gifts: [
    "לגלות שחשבת עליי והשארת לי פתק קטן", "לקבל ממך משהו קטן שהכנת בעצמך",
    "שתשמור בשבילי משהו טעים שידעת שאוהב", "לקבל ממך ציור או תמונה שבחרת בשבילי",
    "לגלות שהבאת לי משהו קטן מהדרך", "שתפתיע אותי בשיר או תמונה שמזכירים לך אותי",
    "לקבל ממך פרח או חפץ קטן שמצאת", "לגלות שהכנת לי הפתעה קטנה בלי סיבה מיוחדת",
  ],
};

const parentToChildGestures: Record<Category, string[]> = {
  words: ["לומר לילד במה אני גאה בו", "לכתוב לו פתק קטן", "לומר תודה על משהו שעשה"],
  time: ["להקדיש זמן רק לשנינו", "לשאול באמת איך עבר היום", "לצאת יחד להליכה קצרה"],
  help: ["לעזור לו במשהו שקשה לו", "להכין איתו משהו לקראת מחר", "להקל עליו במטלה אחת"],
  touch: ["לחבק אותו כשזה מתאים לו", "לשבת קרוב בזמן שיחה", "לסיים את היום בחיבוק אם נעים לו"],
  gifts: ["להפתיע אותו במחווה קטנה", "להכין לו משהו קטן", "להביא דבר קטן שמראה שחשבתי עליו"],
};

const childToParentGestures: Record<Category, string[]> = {
  words: ["לומר תודה על משהו שעשו בשבילי", "לומר לאבא או לאמא שאני אוהב/ת אותם", "להשאיר פתק עם מילה טובה"],
  time: ["לשאול איך עבר היום ולהקשיב באמת", "לשבת כמה דקות רק כדי להיות יחד", "להציע הליכה קצרה יחד"],
  help: ["לעזור בבית בלי שיבקשו", "להכין כוס קפה או תה", "לשאול במה אפשר לעזור היום"],
  touch: ["לתת חיבוק אם זה מתאים", "לשבת קרוב בזמן שיחה", "להיפרד או להיפגש בחיבוק אם נעים"],
  gifts: ["להכין הפתעה קטנה בעבודת יד", "להשאיר פתק קטן", "לשמור משהו טעים ולחלוק יחד"],
};

const gestureIdeas: Record<Category, string[]> = {
  words: ["לומר דבר אחד שאני מעריך/ה בך", "להשאיר פתק קטן עם מילה טובה", "לשלוח הודעת עידוד לפני יום עמוס"],
  time: ["עשר דקות יחד בלי טלפונים", "לצאת להליכה קצרה יחד", "לבחור פעילות קטנה ולעשות אותה יחד"],
  help: ["לעזור בדבר אחד שמכביד השבוע", "להכין יחד משהו ליום הבא", "לשאול: במה אפשר להקל עליך היום?"],
  touch: ["לבחור יחד רגע לחיבוק נעים", "לשבת קרוב בזמן שיחה", "להמציא ברכת שלום משפחתית שמתאימה לשנינו"],
  gifts: ["להכין הפתעה קטנה בעבודת יד", "להביא משהו קטן שמזכיר רגע משותף", "לבחור פינוק קטן ולחלוק אותו יחד"],
};

/* Previous pilot flow retained below for reference.
function LegacyCoupleApp() {
  const [state, setState] = usePersistentState<State>(storageKey, initialState);
  const [showWelcome, setShowWelcome] = useState(true);
  const question = questions[Math.min(state.question, questions.length - 1)];
  const childScores = state.results.child ?? score(state.answers.child);
  const parentScores = state.results.parent ?? score(state.answers.parent);
  const hasProgress = Boolean(state.first || Object.keys(state.answers).length || state.gestures.length);
  const ideas = useMemo(() => {
    const ids = [...new Set([...childScores.slice(0, 2), ...parentScores.slice(0, 2)].map((x) => x.id))];
    return ids.flatMap((id) => gestureIdeas[id].map((text) => ({ key: `${id}-${text}`, category: id, text })));
  }, [childScores, parentScores]);

  function newMeeting() { setState({ ...initialState, meetingDate: new Date().toISOString() }); setShowWelcome(false); }
  function chooseFirst(role: Role) { setState((s) => ({ ...s, first: role, active: role, question: 0, screen: "quiz", meetingDate: s.meetingDate ?? new Date().toISOString() })); }
  function answer(category: Category) {
    if (!state.active) return;
    const role = state.active;
    const roleAnswers = { ...(state.answers[role] ?? {}), [question.id]: category };
    if (state.question < questions.length - 1) return setState((s) => ({ ...s, question: s.question + 1, answers: { ...s.answers, [role]: roleAnswers } }));
    const other: Role = role === "child" ? "parent" : "child";
    const answers = { ...state.answers, [role]: roleAnswers };
    const bothFinished = Boolean(answers[other]);
    setState((s) => ({ ...s, question: 0, answers, results: bothFinished ? { child: score(answers.child), parent: score(answers.parent) } : s.results, screen: bothFinished ? "results" : "handoff" }));
  }
  function toggleGesture(key: string) { setState((s) => ({ ...s, gestures: s.gestures.includes(key) ? s.gestures.filter((x) => x !== key) : s.gestures.length < 3 ? [...s.gestures, key] : s.gestures })); }

  if (showWelcome) return <Shell label="פתיחה"><Welcome hasProgress={hasProgress} date={state.meetingDate} onContinue={() => setShowWelcome(false)} onNew={newMeeting} /></Shell>;
  return <Shell label={screenLabel(state.screen)}>
    {state.screen === "first" && <FirstChooser onChoose={chooseFirst} onBack={() => setShowWelcome(true)} />}
    {state.screen === "quiz" && state.active && <Quiz role={state.active} question={question} index={state.question} selected={state.answers[state.active]?.[question.id]} onAnswer={answer} onBack={() => state.question ? setState((s) => ({ ...s, question: s.question - 1 })) : setState((s) => ({ ...s, screen: s.answers[state.active === "child" ? "parent" : "child"] ? "handoff" : "first" }))} />}
    {state.screen === "handoff" && <Handoff next={state.first === "child" ? "parent" : "child"} onNext={() => setState((s) => ({ ...s, active: s.first === "child" ? "parent" : "child", question: 0, screen: "quiz" }))} />}
    {state.screen === "results" && <Results child={childScores[0]} parent={parentScores[0]} onNext={() => setState((s) => ({ ...s, screen: "gestures" }))} />}
    {state.screen === "gestures" && <Gestures ideas={ideas} selected={state.gestures} onToggle={toggleGesture} onNext={() => setState((s) => ({ ...s, screen: "finish" }))} />}
    {state.screen === "finish" && <Finish selected={ideas.filter((x) => state.gestures.includes(x.key))} date={state.meetingDate} onRestart={() => { setState(initialState); setShowWelcome(true); }} />}
  </Shell>;
}

function Shell({ label, children }: { label: string; children: React.ReactNode }) { return <main className="shell couple-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><section className="app-panel couple-panel family-panel"><header className="topbar"><div className="brand"><span className="brand-mark" aria-hidden="true" /><span>לשים על לב</span></div><div className="step-pill">{label}</div></header>{children}</section></main>; }
function Welcome({ hasProgress, date, onContinue, onNew }: { hasProgress: boolean; date: string | null; onContinue: () => void; onNew: () => void }) { return <div className="screen-block pilot-welcome"><div className="family-symbol small" aria-hidden="true"><span>♡</span><i /></div><div className="welcome-story"><h1>ברוכים הבאים ל״לשים על לב״</h1><p>כולנו אוהבים את הילדים שלנו.</p><p>ורוב הילדים אוהבים מאוד את ההורים שלהם.</p><p>אבל לפעמים קורה דבר מעניין:</p><p className="story-highlight"><strong>האהבה קיימת, אבל לא תמיד היא מורגשת.</strong></p><p>יש ילדים שמרגישים אהובים במיוחד כששומעים מילים טובות.</p><p>יש כאלה שמרגישים אהובים כשמקדישים להם זמן.</p><p>אחרים מרגישים אהובים בעיקר כשעוזרים להם, כשנמצאים קרוב אליהם, או כשעושים בשבילם מחווה קטנה שמראה: ״חשבתי עליך.״</p><p>אין דרך אחת נכונה לאהוב.</p><p>לכל אחד יש דרכים שנוגעות יותר בלב שלו.</p><p>באפליקציה הזו תשבו יחד – הורה וילד – ותגלו איך כל אחד מכם רואה את הדברים.</p><p>המטרה אינה לבדוק מי צדק או מי טעה.</p><p>המטרה היא להכיר טוב יותר זה את עולמו של זה, ולמצוא דרכים קטנות שבהן האהבה שכבר קיימת ביניכם תוכל להגיע עמוק יותר אל הלב.</p></div><div className="preference-note"><span aria-hidden="true">↔</span><p><strong>בכל שאלה תתבקשו לבחור בין שתי אפשרויות טובות.</strong><br />אין תשובה נכונה. פשוט בחרו במה שהיה נוגע בכם יותר.</p></div>{hasProgress ? <div className="resume-card"><p>{date ? `יש מפגש שמור מ־${formatDate(date)}.` : "יש מפגש שמור במכשיר."}</p><button className="primary-button family-primary" type="button" onClick={onContinue}>להמשיך מהמפגש האחרון</button><button className="ghost-button" type="button" onClick={onNew}>להתחיל מפגש חדש</button></div> : <button className="primary-button family-primary" type="button" onClick={onNew}>מתחילים יחד</button>}</div>; }
function FirstChooser({ onChoose, onBack }: { onChoose: (r: Role) => void; onBack: () => void }) { return <div className="screen-block"><Header eyebrow="מתחילים את השיחה" title="מי יענה ראשון?" text="אין משמעות לסדר. הבחירה רק עוזרת לנו לדעת מי מחזיק עכשיו את הטלפון." /><div className="role-grid"><RoleCard icon="🌱" name="הילד" onClick={() => onChoose("child")} /><RoleCard icon="🌿" name="ההורה" onClick={() => onChoose("parent")} /></div><p className="gentle-note">כדאי לתת לכל אחד לענות בקצב שלו, בלי להסביר או לשכנע.</p><button className="ghost-button" type="button" onClick={onBack}>חזרה</button></div>; }
function RoleCard({ icon, name, onClick }: { icon: string; name: string; onClick: () => void }) { return <button type="button" className="role-card" onClick={onClick}><span aria-hidden="true">{icon}</span><strong>{name}</strong><small>אני מתחיל/ה</small></button>; }
function Quiz({ role, question, index, selected, onAnswer, onBack }: { role: Role; question: Question; index: number; selected?: Category; onAnswer: (v: Category) => void; onBack: () => void }) { return <div className="screen-block quiz-single"><div><p className="eyebrow">עכשיו {role === "child" ? "הילד עונה" : "ההורה עונה"} · שאלה {index + 1} מתוך {questions.length}</p><div className="journey-progress"><span style={{ width: `${((index + (selected ? 1 : 0)) / questions.length) * 100}%` }} /></div></div><div className="preference-prompt"><span className="question-badge">{index + 1}</span><h2>{role === "child" ? "מה היה גורם לך להרגיש יותר אהוב/ה?" : "מה לדעתך היה גורם לילד/ה שלך להרגיש יותר אהוב/ה?"}</h2></div><div className="preference-options">{question.options.map((option, optionIndex) => <button type="button" className={selected === option.category ? "preference-card selected" : "preference-card"} key={`${question.id}-${option.category}`} onClick={() => onAnswer(option.category)}><span className="option-letter">{optionIndex === 0 ? "א" : "ב"}</span><strong>{option[role]}</strong><small>{categories[option.category].icon}</small></button>)}</div><p className="selection-hint">שתי האפשרויות טובות. בחרו בזו שהייתה נוגעת יותר בלב.</p><button className="ghost-button" type="button" onClick={onBack}>חזרה</button></div>; }
function Handoff({ next, onNext }: { next: Role; onNext: () => void }) { return <div className="screen-block handoff-screen"><div className="handoff-orbit" aria-hidden="true"><span>✓</span></div><p className="eyebrow">תודה על הכנות</p><h1>מעולה. עכשיו תורו של השני.</h1><p className="family-lead">אל תנסו לזכור את התשובות של מי שענה קודם. פשוט ענו לפי מה שאתם מרגישים.</p><div className="phone-pass"><span aria-hidden="true">↔</span><p>העבירו עכשיו את הטלפון ל{next === "child" ? "ילד" : "הורה"}.</p></div><button className="primary-button family-primary" type="button" onClick={onNext}>{next === "child" ? "הטלפון אצל הילד" : "הטלפון אצל ההורה"}</button></div>; }
function Results({ child, parent, onNext }: { child: Score; parent: Score; onNext: () => void }) { const same = child.id === parent.id; return <div className="screen-block"><Header eyebrow="גילינו יחד..." title="איך האהבה מגיעה אל הלב?" text={same ? "שניכם שמתם לב לדרך דומה שמרגישה משמעותית במיוחד." : "נראה שהאהבה מגיעה אל הלב בדרך קצת אחרת ממה שחשבתם — וזו הזדמנות נהדרת להכיר."} /><div className="shared-results"><Result label="מה שהילד בחר" score={child} /><div className="listening-line" aria-hidden="true">♡</div><Result label="מה שההורה חשב" score={parent} /></div><article className="conversation-card"><h3>רגע לשיחה</h3><p>מה הפתיע אתכם? איזו בחירה הרגישה לכם הכי ברורה?</p><p className="small-copy">אפשר לעצור כאן ולהקשיב. לא צריך להגיע לאותה תשובה.</p></article><button className="primary-button family-primary" type="button" onClick={onNext}>בוחרים משהו קטן לשבוע</button></div>; }
function Result({ label, score }: { label: string; score: Score }) { const x = categories[score.id]; return <article className="shared-result-card"><span className="result-icon" aria-hidden="true">{x.icon}</span><div><p className="eyebrow">{label}</p><h3>{x.name}</h3><p>{x.description}</p></div></article>; }
function Gestures({ ideas, selected, onToggle, onNext }: { ideas: Idea[]; selected: string[]; onToggle: (k: string) => void; onNext: () => void }) { return <div className="screen-block"><Header eyebrow="מהלב אל השבוע" title="בחרו יחד עד שלוש מחוות קטנות" text="בחרו דברים שאפשר באמת לנסות השבוע. לא צריך לשנות הכול — רק לפתוח דלת קטנה לקרבה." /><div className="gesture-list">{ideas.map((x) => <button type="button" key={x.key} aria-pressed={selected.includes(x.key)} disabled={!selected.includes(x.key) && selected.length >= 3} className={selected.includes(x.key) ? "gesture-card selected" : "gesture-card"} onClick={() => onToggle(x.key)}><span aria-hidden="true">{categories[x.category].icon}</span><b>{x.text}</b><i>{selected.includes(x.key) ? "נבחר" : "לבחור"}</i></button>)}</div><p className="selection-count">בחרתם {selected.length} מתוך 3</p><button className="primary-button family-primary" disabled={!selected.length} type="button" onClick={onNext}>זו התכנית שלנו לשבוע</button></div>; }
function Finish({ selected, date, onRestart }: { selected: Idea[]; date: string | null; onRestart: () => void }) { return <div className="screen-block finish-screen"><div className="family-symbol small" aria-hidden="true"><span>♡</span><i /></div><p className="eyebrow">המפגש נשמר · {date ? formatDate(date) : "היום"}</p><h1>שמתם על לב.</h1><p className="family-lead">יש לכם עכשיו כמה צעדים קטנים שיכולים לעזור לאהבה להגיע טוב יותר אל הלב כבר השבוע.</p><div className="weekly-plan">{selected.map((x, i) => <article key={x.key}><span>{i + 1}</span><p>{x.text}</p></article>)}</div><p className="closing-copy">בסוף השבוע תוכלו לשאול יחד: מה הרגיש נעים? מה נרצה לקחת איתנו גם לשבוע הבא?</p><button className="primary-button family-primary" type="button" onClick={onRestart}>מתחילים מפגש חדש</button></div>; }
function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="muted">{text}</p></div>; }
function q(id: string, first: Choice, second: Choice): Question { return { id, options: [first, second] }; }
function c(category: Category, child: string, parent: string): Choice { return { category, child, parent }; }
function score(answers?: Record<string, Category>): Score[] { return (Object.keys(categories) as Category[]).map((id) => ({ id, value: Object.values(answers ?? {}).filter((x) => x === id).length })).sort((a, b) => b.value - a.value); }
function formatDate(date: string) { return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date)); }
function screenLabel(s: Screen) { return ({ first: "ביחד", quiz: "בוחרים", handoff: "מעבירים", results: "מגלים", gestures: "השבוע", finish: "לדרך" } as Record<Screen, string>)[s]; }
*/

export default function CoupleApp() {
  const [state, setState] = usePersistentState<State>(storageKey, initialState);
  const [showWelcome, setShowWelcome] = useState(true);
  const question = questions[Math.min(state.question, questions.length - 1)];
  const childScores = state.results.childSelf ?? scoreRound(state.answers.childSelf);
  const parentScores = state.results.parentSelf ?? scoreRound(state.answers.parentSelf);
  const complete = state.screen === "finish";
  const hasProgress = Boolean(state.meetingDate);
  const parentIdeas = makeIdeas(childScores, parentToChildGestures, "parent");
  const childIdeas = makeIdeas(parentScores, childToParentGestures, "child");

  function startNew() {
    setState({ ...initialState, meetingDate: new Date().toISOString() });
    setShowWelcome(false);
  }

  function answer(category: Category) {
    const roundAnswers = { ...(state.answers[state.round] ?? {}), [question.id]: category };
    if (state.question < questions.length - 1) {
      setState((current) => ({ ...current, question: current.question + 1, answers: { ...current.answers, [current.round]: roundAnswers } }));
      return;
    }
    const answers = { ...state.answers, [state.round]: roundAnswers };
    if (state.round === "childGuess") {
      setState((current) => ({ ...current, question: 0, answers, results: { childSelf: scoreRound(answers.childSelf), parentSelf: scoreRound(answers.parentSelf) }, screen: "results" }));
      return;
    }
    setState((current) => ({ ...current, question: 0, answers, round: nextRound(current.round), screen: "handoff" }));
  }

  function toggle(kind: "parent" | "child", key: string) {
    setState((current) => {
      const field = kind === "parent" ? "parentGestures" : "childGestures";
      const selected = current[field];
      const next = selected.includes(key) ? selected.filter((item) => item !== key) : selected.length < 3 ? [...selected, key] : selected;
      return { ...current, [field]: next };
    });
  }

  if (showWelcome) {
    return <Frame label="פתיחה"><WelcomeV3 complete={complete} hasProgress={hasProgress} date={state.meetingDate} onView={() => setShowWelcome(false)} onNew={startNew} onDelete={() => setState(initialState)} /></Frame>;
  }

  return <Frame label={labelFor(state.screen)}>
    {state.screen === "quiz" && <PreferenceQuiz round={state.round} question={question} index={state.question} selected={state.answers[state.round]?.[question.id]} onAnswer={answer} onBack={() => state.question ? setState((current) => ({ ...current, question: current.question - 1 })) : setShowWelcome(true)} />}
    {state.screen === "handoff" && <RoundHandoff round={state.round} onNext={() => setState((current) => ({ ...current, screen: "quiz" }))} />}
    {state.screen === "results" && <Discovery child={childScores} parent={parentScores} onNext={() => setState((current) => ({ ...current, screen: "parentGestures" }))} />}
    {state.screen === "parentGestures" && <GestureChoice who="parent" scores={childScores} ideas={parentIdeas} selected={state.parentGestures} onToggle={(key) => toggle("parent", key)} onNext={() => setState((current) => ({ ...current, screen: "childGestures" }))} />}
    {state.screen === "childGestures" && <GestureChoice who="child" scores={parentScores} ideas={childIdeas} selected={state.childGestures} onToggle={(key) => toggle("child", key)} onNext={() => setState((current) => ({ ...current, screen: "finish" }))} />}
    {state.screen === "finish" && <FinalSummary childScores={childScores} parentScores={parentScores} parentChoices={parentIdeas.filter((idea) => state.parentGestures.includes(idea.key))} childChoices={childIdeas.filter((idea) => state.childGestures.includes(idea.key))} date={state.meetingDate} onHome={() => setShowWelcome(true)} />}
  </Frame>;
}

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return <main className="shell couple-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><section className="app-panel couple-panel family-panel"><header className="topbar"><div className="brand"><span className="brand-mark" aria-hidden="true" /><span>לשים על לב</span></div><div className="step-pill">{label}</div></header>{children}</section></main>;
}

function WelcomeV3({ complete, hasProgress, date, onView, onNew, onDelete }: { complete: boolean; hasProgress: boolean; date: string | null; onView: () => void; onNew: () => void; onDelete: () => void }) {
  return <div className="screen-block pilot-welcome"><div className="family-symbol small" aria-hidden="true"><span>♡</span><i /></div><div className="welcome-story"><h1>ברוכים הבאים ל״לשים על לב״</h1><p>כולנו אוהבים את הילדים שלנו. ורוב הילדים אוהבים מאוד את ההורים שלהם.</p><p>אבל לפעמים קורה דבר מעניין:</p><p className="story-highlight"><strong>האהבה קיימת, אבל לא תמיד היא מורגשת.</strong></p><p>יש ילדים שמרגישים אהובים במיוחד כששומעים מילים טובות. יש כאלה שמרגישים אהובים כשמקדישים להם זמן. אחרים מרגישים אהובים כשעוזרים להם, כשנמצאים קרוב אליהם או כשעושים מחווה קטנה שאומרת: ״חשבתי עליך.״</p><p>אין דרך אחת נכונה לאהוב. לכל אחד יש דרכים שנוגעות יותר בלב שלו.</p><p>במפגש הזה תגלו גם איך הילד מרגיש אהוב וגם איך ההורה מרגיש את האהבה של הילד.</p><p>המטרה אינה לבדוק מי צדק או מי טעה, אלא להכיר טוב יותר ולבחור דרכים קטנות שבהן האהבה שכבר קיימת תגיע עמוק יותר אל הלב.</p></div><div className="preference-note"><span aria-hidden="true">↔</span><p><strong>בכל שאלה תבחרו בין שתי אפשרויות טובות.</strong><br />אין תשובה נכונה. פשוט בחרו במה שהיה נוגע בכם יותר.</p></div>{complete ? <div className="resume-card"><p>{date ? `המפגש האחרון נשמר ב־${formatMeetingDate(date)}.` : "המפגש האחרון שמור במכשיר."}</p><button className="primary-button family-primary" type="button" onClick={onView}>צפה במפגש האחרון</button><button className="ghost-button" type="button" onClick={onNew}>התחל מפגש חדש</button><button className="delete-session-button" type="button" onClick={onDelete}>מחק את המפגש השמור</button></div> : hasProgress ? <div className="resume-card"><p>יש מפגש שעדיין לא הסתיים.</p><button className="primary-button family-primary" type="button" onClick={onView}>להמשיך את המפגש</button><button className="ghost-button" type="button" onClick={onNew}>להתחיל מפגש חדש</button><button className="delete-session-button" type="button" onClick={onDelete}>מחק את המפגש האחרון</button></div> : <button className="primary-button family-primary" type="button" onClick={onNew}>מתחילים יחד</button>}</div>;
}

function PreferenceQuiz({ round, question, index, selected, onAnswer, onBack }: { round: Round; question: Question; index: number; selected?: Category; onAnswer: (value: Category) => void; onBack: () => void }) {
  const meta = roundMeta[round];
  return <div className="screen-block quiz-single"><div><p className="eyebrow">{meta.eyebrow} · שאלה {index + 1} מתוך {questions.length}</p><div className="journey-progress"><span style={{ width: `${((index + (selected ? 1 : 0)) / questions.length) * 100}%` }} /></div></div><div className="preference-prompt"><span className="question-badge">{index + 1}</span><h2>{meta.prompt}</h2></div><div className="preference-options">{question.options.map((option, optionIndex) => <button type="button" className={selected === option.category ? "preference-card selected" : "preference-card"} key={`${question.id}-${option.category}`} onClick={() => onAnswer(option.category)}><span className="option-letter">{optionIndex ? "ב" : "א"}</span><strong>{choiceText(round, index, optionIndex, option)}</strong><small>{categories[option.category].icon}</small></button>)}</div><p className="selection-hint">שתי האפשרויות טובות. בחרו בזו שהייתה נוגעת יותר בלב.</p><button className="ghost-button" type="button" onClick={onBack}>חזרה</button></div>;
}

function RoundHandoff({ round, onNext }: { round: Round; onNext: () => void }) {
  const copy: Record<Round, { title: string; text: string; button: string }> = {
    childSelf: { title: "מתחילים בלב של הילד.", text: "הילד יבחר מה היה גורם לו להרגיש יותר אהוב.", button: "הילד מוכן" },
    parentGuess: { title: "הילד סיים לענות.", text: "עכשיו ההורה ינסה לנחש מה הילד בחר. אל תגלו עדיין את התשובות.", button: "הטלפון אצל ההורה" },
    parentSelf: { title: "עכשיו נכיר את הלב של ההורה.", text: "הורה, ענה ישירות לילד: מה גורם לך להרגיש את האהבה שלו אליך?", button: "ההורה מוכן לענות" },
    childGuess: { title: "ההורה סיים לענות.", text: "עכשיו הילד ינסה לנחש אילו מחוות נוגעות יותר בלב של ההורה.", button: "הטלפון אצל הילד" },
  };
  const item = copy[round];
  return <div className="screen-block handoff-screen"><div className="handoff-orbit" aria-hidden="true"><span>✓</span></div><p className="eyebrow">עוברים לשלב הבא</p><h1>{item.title}</h1><p className="family-lead">{item.text}</p><button className="primary-button family-primary" type="button" onClick={onNext}>{item.button}</button></div>;
}

function Discovery({ child, parent, onNext }: { child: Score[]; parent: Score[]; onNext: () => void }) {
  return <div className="screen-block"><HeaderV3 eyebrow="גילינו יחד..." title="שני לבבות, שתי דרכים להרגיש אהבה" text="התוצאה היא לא סוף התהליך. היא הזמנה להקשיב ולנסות משהו קטן השבוע." /><DiscoveryBlock title="מה גילינו על הילד" text={`נראה שהילד מרגיש במיוחד את האהבה דרך ${joinNames(child)}.`} scores={child} /><DiscoveryBlock title="מה גילינו על ההורה" text={`נראה שההורה מרגיש את אהבת הילד במיוחד דרך ${joinNames(parent)}.`} scores={parent} /><button className="primary-button family-primary" type="button" onClick={onNext}>בוחרים מחוות לשבוע</button></div>;
}

function DiscoveryBlock({ title, text, scores }: { title: string; text: string; scores: Score[] }) {
  return <section className="discovery-block"><p className="eyebrow">{title}</p><p className="discovery-sentence">{text}</p><div className="two-paths">{scores.slice(0, 2).map((score) => <span key={score.id}>{categories[score.id].icon} {categories[score.id].name}</span>)}</div></section>;
}

function GestureChoice({ who, scores, ideas, selected, onToggle, onNext }: { who: "parent" | "child"; scores: Score[]; ideas: Idea[]; selected: string[]; onToggle: (key: string) => void; onNext: () => void }) {
  const isParent = who === "parent";
  return <div className="screen-block"><HeaderV3 eyebrow={isParent ? "הבחירה של ההורה" : "הבחירה של הילד"} title={isParent ? "איך אביע אהבה לילד השבוע?" : "איך אביע אהבה להורה השבוע?"} text={`בחרו עד שלוש מחוות קטנות שמתאימות ל${joinNames(scores)}.`} /><div className="gesture-list">{ideas.map((idea) => <button type="button" key={idea.key} aria-pressed={selected.includes(idea.key)} disabled={!selected.includes(idea.key) && selected.length >= 3} className={selected.includes(idea.key) ? "gesture-card selected" : "gesture-card"} onClick={() => onToggle(idea.key)}><span aria-hidden="true">{categories[idea.category].icon}</span><b>{idea.text}</b><i>{selected.includes(idea.key) ? "נבחר" : "לבחור"}</i></button>)}</div><p className="selection-count">נבחרו {selected.length} מתוך 3</p><button className="primary-button family-primary" disabled={!selected.length} type="button" onClick={onNext}>{isParent ? "עכשיו הילד בוחר" : "לסיכום המשותף"}</button></div>;
}

function FinalSummary({ childScores, parentScores, parentChoices, childChoices, date, onHome }: { childScores: Score[]; parentScores: Score[]; parentChoices: Idea[]; childChoices: Idea[]; date: string | null; onHome: () => void }) {
  return <div className="screen-block final-summary"><div className="family-symbol small" aria-hidden="true"><span>♡</span><i /></div><p className="eyebrow">המפגש נשמר · {date ? formatMeetingDate(date) : "היום"}</p><h1>השבוע ננסה לפתוח זה לזה את הלב</h1><p className="summary-discovery">הילד מרגיש אהוב במיוחד דרך <strong>{joinNames(childScores)}</strong>.</p><p className="summary-discovery">ההורה מרגיש את אהבת הילד במיוחד דרך <strong>{joinNames(parentScores)}</strong>.</p><Plan title="אבא / אמא בחרו" ideas={parentChoices} /><Plan title="הילד בחר" ideas={childChoices} /><blockquote>לא מספיק לאהוב. חשוב גם שהאהבה תצליח להגיע אל הלב.</blockquote><button className="primary-button family-primary" type="button" onClick={onHome}>חזרה למסך הראשי</button></div>;
}

function Plan({ title, ideas }: { title: string; ideas: Idea[] }) { return <section className="saved-plan"><h2>{title}</h2>{ideas.map((idea) => <p key={idea.key}><span aria-hidden="true">✓</span>{idea.text}</p>)}</section>; }
function HeaderV3({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="muted">{text}</p></div>; }

const roundMeta: Record<Round, { eyebrow: string; prompt: string }> = {
  childSelf: { eyebrow: "הילד בוחר", prompt: "מה היה גורם לך להרגיש יותר אהוב/ה?" },
  parentGuess: { eyebrow: "ההורה מנחש", prompt: "מה לדעתך היה נוגע יותר בלב של הילד?" },
  parentSelf: { eyebrow: "ההורה בוחר", prompt: "מה היה גורם לך להרגיש יותר את האהבה של הילד?" },
  childGuess: { eyebrow: "הילד מנחש", prompt: "מה לדעתך היה נוגע יותר בלב של ההורה?" },
};

function choiceText(round: Round, questionIndex: number, optionIndex: number, option: Choice) {
  if (round === "childSelf") return option.child;
  if (round === "parentGuess") return option.parent;
  const previous = questions.slice(0, questionIndex).flatMap((question) => question.options).filter((item) => item.category === option.category).length;
  const beforeInQuestion = questions[questionIndex].options.slice(0, optionIndex).filter((item) => item.category === option.category).length;
  return parentLoveChoices[option.category][(previous + beforeInQuestion) % parentLoveChoices[option.category].length];
}
function nextRound(round: Round): Round { return ({ childSelf: "parentGuess", parentGuess: "parentSelf", parentSelf: "childGuess", childGuess: "childGuess" } as Record<Round, Round>)[round]; }
function scoreRound(answers?: Record<string, Category>): Score[] { return (Object.keys(categories) as Category[]).map((id) => ({ id, value: Object.values(answers ?? {}).filter((answer) => answer === id).length })).sort((a, b) => b.value - a.value); }
function makeIdeas(scores: Score[], source: Record<Category, string[]>, prefix: string): Idea[] { return scores.slice(0, 2).flatMap((score) => source[score.id].map((text) => ({ key: `${prefix}-${score.id}-${text}`, category: score.id, text }))); }
function joinNames(scores: Score[]) { return scores.slice(0, 2).map((score) => categories[score.id].name).join(" ו"); }
function formatMeetingDate(date: string) { return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date)); }
function labelFor(screen: Screen) { return ({ quiz: "בוחרים", handoff: "מעבירים", results: "מגלים", parentGestures: "ההורה", childGestures: "הילד", finish: "סיכום" } as Record<Screen, string>)[screen]; }
