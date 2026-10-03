export const generationThemes = {
  Children: { theme: 'children', avatar: 'animal', font: 'Fredoka', wallpaper: 'bubbles', dark: { accent: '#f6c453', glow: 'rgba(246,196,83,.3)' }, suggestions: ['Explain planets simply', 'Tell me a gentle story', 'What is a rainbow?'] },
  Teenagers: { theme: 'teenagers', avatar: 'robot', font: 'Manrope', wallpaper: 'stickers', dark: { accent: '#d79cff', glow: 'rgba(215,156,255,.3)' }, suggestions: ['Help me study smarter', 'Give me a creative idea', 'Explain this like I am 15'] },
  Adult: { theme: 'adult', avatar: 'wizard', font: 'Manrope', wallpaper: 'particles', dark: { accent: '#f59e6b', glow: 'rgba(245,158,107,.35)' }, suggestions: ['Explain React simply', 'Help me make a plan', 'Challenge my assumption'] },
  'Young Man': { theme: 'young-man', avatar: 'streetwear', font: 'Space Grotesk', wallpaper: 'grid', dark: { accent: '#63e6d1', glow: 'rgba(99,230,209,.3)' }, suggestions: ['Build a sharp routine', 'Make this more practical', 'Help me decide'] },
  'Old/Senior': { theme: 'senior', avatar: 'wizard', font: 'Manrope', wallpaper: 'linen', dark: { accent: '#ffd28a', glow: 'rgba(255,210,138,.28)' }, suggestions: ['Explain this clearly', 'Help me write a letter', 'Tell me something useful'] },
  'Gen Z': { theme: 'gen-z', avatar: 'streetwear', font: 'Space Grotesk', wallpaper: 'neon', dark: { accent: '#ff76bb', glow: 'rgba(255,118,187,.32)' }, suggestions: ['Make this less boring', 'Give me the honest take', 'Explain the vibe'] },
  'Gen Alpha': { theme: 'gen-alpha', avatar: 'alien', font: 'Space Grotesk', wallpaper: 'pixels', dark: { accent: '#ffd45c', glow: 'rgba(255,212,92,.3)' }, suggestions: ['Explain it game-style', 'Give me a fun challenge', 'Tell me a wild fact'] },
};

export function getGenerationTheme(generation) {
  return generationThemes[generation] || generationThemes.Adult;
}