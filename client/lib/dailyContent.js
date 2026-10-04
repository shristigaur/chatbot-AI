export const DAILY_CONTENT = {
  Children: [
    { question: 'Why is the sky blue?', fact: 'A day on Venus is longer than a year on Venus!' },
    { question: 'What is the biggest animal?', fact: 'Blue whales have hearts the size of a car.' },
    { question: 'How do fish breathe?', fact: 'Some fish can cough to clear their gills.' },
    { question: 'Where do stars go in the daytime?', fact: 'The sun is just a really close star.' },
    { question: 'Why do we need to sleep?', fact: 'Sea otters hold hands when they sleep so they don’t drift apart.' }
  ],
  Teenagers: [
    { question: 'How do algorithms actually work?', fact: 'The first computer bug was an actual moth.' },
    { question: 'What is a black hole?', fact: 'Water makes different sounds when poured hot vs cold.' },
    { question: 'How does Wi-Fi work?', fact: 'Your brain generates enough electricity to power a small lightbulb.' },
    { question: 'What is the Fermi Paradox?', fact: 'There are more trees on Earth than stars in the Milky Way.' },
    { question: 'How do video games render 3D?', fact: 'The first video game ever was a simple tennis game made in 1958.' }
  ],
  Adult: [
    { question: 'Explain quantum computing simply', fact: 'The Oxford University is older than the Aztec Empire.' },
    { question: 'What are the main principles of stoicism?', fact: 'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.' },
    { question: 'How do I build a better daily routine?', fact: 'Scotland has 421 words for "snow".' },
    { question: 'What causes inflation?', fact: 'Humans share 50% of their DNA with bananas.' },
    { question: 'Explain the concept of compound interest', fact: 'A jiffy is an actual unit of time (1/100th of a second).' }
  ],
  'Young Man': [
    { question: 'How do I optimize my workout routine?', fact: 'You cannot hum while holding your nose.' },
    { question: 'Explain the basics of investing', fact: 'The mantis shrimp can punch with the speed of a bullet.' },
    { question: 'How to improve focus and productivity?', fact: 'A cloud can weigh more than a million pounds.' },
    { question: 'What makes a good leader?', fact: 'Water expands when it freezes, unlike almost everything else.' },
    { question: 'How do car engines work?', fact: 'There is a volcano on Mars three times the size of Everest.' }
  ],
  'Old/Senior': [
    { question: 'Tell me about the history of jazz', fact: 'Honey never spoils. You could eat 3000-year-old honey.' },
    { question: 'How has communication technology changed?', fact: 'The Earth\'s rotation is gradually slowing down.' },
    { question: 'What are some gentle exercises I can do?', fact: 'A flock of crows is known as a murder.' },
    { question: 'Explain how cloud storage works', fact: 'Cats cannot taste sweetness.' },
    { question: 'What is the history of the written word?', fact: 'The word "muscle" comes from Latin for "little mouse".' }
  ],
  'Gen Z': [
    { question: 'What is the metaverse?', fact: 'Water isn\'t wet, it makes things wet.' },
    { question: 'Explain blockchain simply', fact: 'The brain literally names itself.' },
    { question: 'How does the TikTok algorithm work?', fact: 'Cows have besties.' },
    { question: 'What are some sustainable living tips?', fact: 'A strawberry isn\'t a berry, but a banana is.' },
    { question: 'Explain the psychology of social media', fact: 'T-Rex lived closer in time to us than to Stegosaurus.' }
  ],
  'Gen Alpha': [
    { question: 'How do you make a video game?', fact: 'Wombats drop cube-shaped blocks like Minecraft.' },
    { question: 'What is AI?', fact: 'Sharks are older than trees.' },
    { question: 'How does the internet travel under the ocean?', fact: 'If you fold paper 42 times, it reaches the moon.' },
    { question: 'What is the fastest animal?', fact: 'There is a jellyfish that lives forever.' },
    { question: 'How do astronauts go to the bathroom in space?', fact: 'Nintendo is older than the Titanic.' }
  ]
};

export function getDailyContent(generation) {
  const contentList = DAILY_CONTENT[generation] || DAILY_CONTENT['Adult'];
  const today = new Date();
  // Generate a consistent index for the day, offset by year to ensure variety
  const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const index = dayIndex % contentList.length;
  
  return contentList[index];
}
