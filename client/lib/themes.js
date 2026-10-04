export const generationThemes = {
  Children: { theme: 'theme-children', avatar: 'cartoon', font: 'Fredoka', suggestions: ['Tell me a story', 'Animals', 'Why is the sky blue?', 'Fun facts'], greeting: 'Hi! What do you want to know today?' },
  Teenagers: { theme: 'theme-teenagers', avatar: 'default', font: 'Manrope', suggestions: ['Help me study smarter', 'Give me a creative idea', 'Explain this like I am 15', 'Tell me a joke'], greeting: "Hey, what's up? Let's figure it out." },
  Adult: { theme: 'theme-adult', avatar: 'default', font: 'Manrope', suggestions: ['Explain React simply', 'Help me make a plan', 'Challenge my assumption', 'Review my code'], greeting: 'Make room for better questions.' },
  'Young Man': { theme: 'theme-youngman', avatar: 'default', font: 'Manrope', suggestions: ['Build a sharp routine', 'Make this more practical', 'Help me decide', 'Summarize this'], greeting: 'Ready to build something.' },
  'Old/Senior': { theme: 'theme-senior', avatar: 'default', font: 'Manrope', suggestions: ['Explain this clearly', 'Help me write a letter', 'Tell me something useful', 'How does this work?'], greeting: "Let's take it one step at a time." },
  'Gen Z': { theme: 'theme-genz', avatar: 'default', font: 'Manrope', suggestions: ['Make this less boring', 'Give me the honest take', 'Explain the vibe', 'Give me an aesthetic idea'], greeting: "What's the vibe?" },
  'Gen Alpha': { theme: 'theme-genalpha', avatar: 'default', font: 'Manrope', suggestions: ['Explain it game-style', 'Give me a fun challenge', 'Tell me a wild fact', 'Give me a speedrun strat'], greeting: 'Ready up!' },
};

export function getGenerationTheme(generation) {
  return generationThemes[generation] || generationThemes.Adult;
}