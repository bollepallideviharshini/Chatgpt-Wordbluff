export interface Question {
  id: string;
  prompt: string;
  answer: string;
  acceptableAnswers: string[];
  sampleLies: string[];
  funFact: string;
}

export const QUESTIONS_BANK: Question[] = [
  {
    id: "q1",
    prompt: "In 1923, jockey Frank Hayes won a steeplechase at Belmont Park despite having died of a ______ during the race.",
    answer: "Heart attack",
    acceptableAnswers: ["heart attack", "cardiac arrest", "heart failure"],
    sampleLies: ["Lightning strike", "Broken neck", "Bee sting"],
    funFact: "Frank Hayes suffered a fatal heart attack mid-race, but his horse Sweet Kiss crossed the finish line first with Frank still in the saddle!"
  },
  {
    id: "q2",
    prompt: "In Victorian England, special teacups were invented to protect men's ______ from getting soaked in hot tea.",
    answer: "Mustaches",
    acceptableAnswers: ["mustache", "mustaches", "moustache", "moustaches", "facial hair", "beard"],
    sampleLies: ["Wigs", "Silk cravats", "Monocles"],
    funFact: "Mustache cups featured a ceramic ledge inside to keep mustache wax from melting into the morning Earl Grey."
  },
  {
    id: "q3",
    prompt: "For 20 years until his death in 2017, the honorary mayor of the Alaskan town of Talkeetna was a ______ named Stubbs.",
    answer: "Cat",
    acceptableAnswers: ["cat", "feline", "kitten"],
    sampleLies: ["Moose", "Golden retriever", "Siberian husky"],
    funFact: "Mayor Stubbs received thousands of letters from tourists and drank water out of a wine glass spiked with catnip every afternoon."
  },
  {
    id: "q4",
    prompt: "A group of pugs is officially referred to as a ______.",
    answer: "Grumble",
    acceptableAnswers: ["grumble", "a grumble"],
    sampleLies: ["Snort", "Waddle", "Wrinkle"],
    funFact: "Because pugs make constant grunting and snorting sounds, a gathering of them is delightfully called a grumble."
  },
  {
    id: "q5",
    prompt: "Before alarm clocks were common, British workers hired 'knocker-uppers' to wake them up by shooting ______ at their windows.",
    answer: "Dried peas",
    acceptableAnswers: ["peas", "dried peas", "pea", "pebbles", "beans"],
    sampleLies: ["Marbles", "Acorns", "Paper airplanes"],
    funFact: "Knocker-uppers used long pea-shooters to blast dried peas at second-floor bedroom windows until the client appeared."
  },
  {
    id: "q6",
    prompt: "The inventor of the Pringles potato chip can, Fredric Baur, was so proud of his design that he was ______ in one after he died.",
    answer: "Buried",
    acceptableAnswers: ["buried", "interred", "cremated", "laid to rest"],
    sampleLies: ["Mummified", "Resurrected", "Sculpted"],
    funFact: "Baur's children honored his dying wish by purchasing an Original flavor Pringles can and burying his ashes in it."
  },
  {
    id: "q7",
    prompt: "In ancient Rome, people regularly used boiled ______ as mouthwash to whiten their teeth.",
    answer: "Urine",
    acceptableAnswers: ["urine", "pee", "piss"],
    sampleLies: ["Vinegar", "Goat milk", "Lead water"],
    funFact: "Urine was prized because the ammonia acted as a bleaching agent; Rome even taxed the collection of public urine!"
  },
  {
    id: "q8",
    prompt: "In Switzerland, it is legally forbidden to own only a single ______ because they are considered social animals that get lonely.",
    answer: "Guinea pig",
    acceptableAnswers: ["guinea pig", "guineapig", "guinea pigs"],
    sampleLies: ["Parrot", "Goldfish", "Hamster"],
    funFact: "There are even matchmaking and rental services in Switzerland so if one guinea pig passes away, the survivor has a companion."
  },
  {
    id: "q9",
    prompt: "During World War II, the British government spread the rumor that eating carrots gave pilots ______ to hide radar technology.",
    answer: "Night vision",
    acceptableAnswers: ["night vision", "super vision", "night sight", "see in the dark"],
    sampleLies: ["Super hearing", "Immunity to cold", "Steady hands"],
    funFact: "The myth was so convincing that German Luftwaffe commanders actually began feeding their own fighter pilots extra carrots."
  },
  {
    id: "q10",
    prompt: "The official national animal of Scotland is the mythical ______.",
    answer: "Unicorn",
    acceptableAnswers: ["unicorn", "the unicorn"],
    sampleLies: ["Dragon", "Loch Ness Monster", "Griffin"],
    funFact: "In Celtic mythology, the unicorn was a symbol of purity, noble pride, and unconquerable strength."
  },
  {
    id: "q11",
    prompt: "In 2011, a traveler at Miami International Airport was arrested with 70 live ______ taped inside his trousers.",
    answer: "Birds",
    acceptableAnswers: ["birds", "songbirds", "pigeons", "hummingbirds", "parrots"],
    sampleLies: ["Snakes", "Turtles", "Lobsters"],
    funFact: "The smuggler had stitched tiny fabric pockets into his custom pants to hide Cuban songbirds worth thousands of dollars."
  },
  {
    id: "q12",
    prompt: "In 1974, playing the board game ______ was officially outlawed in public spaces in Ethiopia.",
    answer: "Scrabble",
    acceptableAnswers: ["scrabble"],
    sampleLies: ["Monopoly", "Chess", "Backgammon"],
    funFact: "The military junta banned Scrabble in public over fears that dissidents were passing covert political messages using tiles."
  },
  {
    id: "q13",
    prompt: "At the 1904 Olympic marathon, the runner who crossed the finish line first was disqualified after admitting he had traveled 11 miles by ______.",
    answer: "Car",
    acceptableAnswers: ["car", "automobile", "motorcar", "taxi"],
    sampleLies: ["Bicycle", "Train", "Horse"],
    funFact: "Fred Lorz got cramps at mile 9, hitched a ride in his manager's automobile, then got out and jogged into the stadium to claim gold!"
  },
  {
    id: "q14",
    prompt: "In the 16th century, wealthy European aristocrats powdered their faces with a mixture containing lead and ______.",
    answer: "Vinegar",
    acceptableAnswers: ["vinegar", "sour wine", "acid"],
    sampleLies: ["Egg yolks", "Crushed pearls", "Arsenic"],
    funFact: "Known as Venetian Ceruse or 'Spirits of Saturn', this toxic cosmetic corroded skin, causing hair loss and dental decay."
  },
  {
    id: "q15",
    prompt: "In 2013, a university student in Scotland lost their thumb wrestling championship title after failing a ______ test.",
    answer: "Drug",
    acceptableAnswers: ["drug", "doping", "steroid"],
    sampleLies: ["Lie detector", "Finger length", "Nail clipper"],
    funFact: "The World Thumb Wrestling Federation had instituted random testing; the champion tested positive for unauthorized anti-inflammatory creams."
  }
];

export function getRandomQuestions(count: number = 3): Question[] {
  const shuffled = [...QUESTIONS_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
