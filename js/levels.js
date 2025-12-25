export const levels = [
  {
    title: "Fast Food",
    subtitle: "Hmm… what should we eat?",
    exits: {
      E1: "McDo",
      E2: "Jollibee",
      E3: "Chowking"
    },
    dialogue: {
      E1: [
        // { who: "me", text: "Hmm… what should we eat?" },
        { who: "her", text: "McDo 🍟" },
        { who: "her", text: "Classic choice 😌" },
        { who: "me", text: "Too basic?" },
        { who: "her", text: "Nope 💕 it’s comforting." }
      ],

      E2: [
        // { who: "me", text: "I’m craving something…" },
        { who: "her", text: "Jollibee 🐝" },
        { who: "her", text: "Uy comfort food 💖" },
        { who: "me", text: "You like it too?" },
        { who: "her", text: "Always 😌" }
      ],

      E3: [
        // { who: "me", text: "Let’s try something different." },
        { who: "her", text: "Chowking 😎" },
        { who: "her", text: "Bold taste!" },
        { who: "me", text: "That’s good… right?" },
        { who: "her", text: "Very ✨" }
      ]
    },
    logos: {
      E1: "assets/images/mcdo.png",
      E2: "assets/images/jabe.png",
      E3: "assets/images/chowking.png"
    },
    maze: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,'S',0,0,1,0,0,0,0,0,0,'E1',1],
    [1,1,1,0,1,0,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,0,1],
    [1,1,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,'E2',1,1,1,1,0,1,1,1,1,'E3',1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  },

  {
    title: "Coffee Place",
    subtitle: "Pick your caffeine",
    exits: {
      E1: "Starbucks",
      E2: "Chagee",
      E3: "Coco"
    },
     dialogue: {
      E1: [
        // { who: "me", text: "Coffee time?" },
        { who: "her", text: "Starbucks ☕" },
        { who: "her", text: "Reliable choice 💕" },
        { who: "me", text: "You judge me?" },
        { who: "her", text: "Never 😌" }
      ],

      E2: [
        // { who: "me", text: "Let’s try something new." },
        { who: "her", text: "Chagee 🍃" },
        { who: "her", text: "Ooo classy 💖" },
        { who: "me", text: "You approve?" },
        { who: "her", text: "Definitely ✨" }
      ],

      E3: [
        // { who: "me", text: "Sweet drinks today." },
        { who: "her", text: "Coco 🧋" },
        { who: "her", text: "Fun choice 😄" },
        { who: "me", text: "Too childish?" },
        { who: "her", text: "Cute actually 💕" }
      ]
    },
    logos: {
      E1: "assets/images/starbucks.png",
      E2: "assets/images/chagee.png",
      E3: "assets/images/coco.jpg"
    },
   maze: [
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,'S',0,0,1,0,0,0,0,0,0,'E2',1],
  [1,1,1,0,1,0,1,1,1,1,0,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,1,1,1],
  [1,0,1,0,0,0,0,1,0,0,0,'E3',1],
  [1,0,1,0,1,1,0,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,'E1',1,1,1,1,0,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1]
]

  },

  {
    title: "Go To Place",
    subtitle: "Where to go?",
    exits: {
      E1: "SM",
      E2: "Ugbo",
      E3: "Intramuros"
    },
    dialogue: {
      E1: [
        // { who: "me", text: "Where do you want to go?" },
        { who: "her", text: "SM 🛍️" },
        { who: "her", text: "Shopping date? 😌" },
        { who: "me", text: "Window shopping counts, right?" },
        { who: "her", text: "As long as we’re together 💕" }
      ],

      E2: [
        // { who: "me", text: "I’m thinking something chill." },
        { who: "her", text: "Ugbo 🍢" },
        { who: "her", text: "Street food trip? 😋" },
        { who: "me", text: "You down for it?" },
        { who: "her", text: "Always 💖 I like simple dates." }
      ],

      E3: [
        // { who: "me", text: "What about somewhere different?" },
        { who: "her", text: "Intramuros 🏛️" },
        { who: "her", text: "That’s romantic 😳" },
        { who: "me", text: "History walk with you?" },
        { who: "her", text: "I’d love that ✨" }
      ]
    },
    logos: {
      E1: "assets/images/sm.png",
      E2: "assets/images/ugbo.png",
      E3: "assets/images/intramuros.png"
    },
   maze: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,'S',0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,'E1',1],
    [1,0,1,1,1,1,1,1,0,1,1,1,1],
    [1,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,'E3',1],
    [1,'E2',1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  }
];
