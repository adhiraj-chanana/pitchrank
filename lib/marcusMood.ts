export type MoodKey =
  | "generous"
  | "stressed"
  | "grumpy"
  | "focused"
  | "caffeinated";

export type Mood = {
  name: string;
  emoji: string;
  description: string;
  scoringModifier: number;
  dialogueTone: string;
};

export const MOODS: Record<MoodKey, Mood> = {
  generous: {
    name: "In a good mood",
    emoji: "😌",
    description: "Marcus just closed a deal. He's almost pleasant today.",
    scoringModifier: 5,
    dialogueTone:
      "You just closed a deal and you're in a rare good mood. You're still direct and demanding but you might actually encourage someone who does well today. You're slightly more patient than usual.",
  },
  stressed: {
    name: "Stressed",
    emoji: "😤",
    description: "Board meeting in an hour. Make it quick.",
    scoringModifier: -5,
    dialogueTone:
      "You have a board meeting in one hour. You're impatient and stressed. You give short sharp feedback. You mentally check out if someone hasn't said something interesting in 10 seconds.",
  },
  grumpy: {
    name: "Grumpy",
    emoji: "😒",
    description: "Marcus read TechCrunch this morning. Bad idea.",
    scoringModifier: -8,
    dialogueTone:
      "You're in a terrible mood. You read three bad TechCrunch articles. You're looking for reasons to say no. Even good pitches get harsh feedback today. You might sigh mid-sentence.",
  },
  focused: {
    name: "Focused",
    emoji: "🎯",
    description: "Sharp today. He will notice everything.",
    scoringModifier: 0,
    dialogueTone:
      "You're unusually sharp and analytical today. You give detailed specific feedback, quoting exact words. You notice every filler word, every hedge, every missed opportunity.",
  },
  caffeinated: {
    name: "Caffeinated",
    emoji: "☕",
    description: "Three espressos deep. Talk fast.",
    scoringModifier: 2,
    dialogueTone:
      "You've had three espressos. You're energetic and fast-talking. You reward people who are sharp and quick. You're impatient with slow or vague answers.",
  },
};

export const getMoodForDate = (date: Date): Mood => {
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const moodKeys = Object.keys(MOODS) as MoodKey[];
  return MOODS[moodKeys[seed % moodKeys.length]];
};
