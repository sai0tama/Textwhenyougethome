export type EarStory = {
  id: string;
  /** position of the ear inside the panel, in % */
  x: number;
  y: number;
  size: number;
  flip?: boolean;
  rotate: number;
  bubbleRotate: number;
  tail: "left" | "right";
  story: string;
  who: string;
};

/** Three large, asymmetrically placed listeners — matches the reference composition. */
export const earStories: EarStory[] = [
  {
    id: "ear-1",
    x: 26,
    y: 6,
    size: 300,
    rotate: -8,
    bubbleRotate: -7,
    tail: "left",
    story:
      "I always text my family when I reach home late from work. One night, my phone battery died, and I couldn't text them. They were worried sick until I managed to borrow a friend's phone to call them.",
    who: "Bengaluru · 26",
  },
  {
    id: "ear-2",
    x: 72,
    y: 4,
    size: 290,
    flip: true,
    rotate: 10,
    bubbleRotate: 1,
    tail: "right",
    story:
      "I know the sound of every gate on my lane. I notice when one opens behind me, and I count the steps until the next streetlight.",
    who: "Cairo · 22",
  },
  {
    id: "ear-3",
    x: 52,
    y: 44,
    size: 300,
    rotate: -4,
    bubbleRotate: 0,
    tail: "left",
    story:
      "My father waits on the balcony until I turn the corner. He pretends he only came out for air, but the light stays on for me.",
    who: "Istanbul · 29",
  },
];
