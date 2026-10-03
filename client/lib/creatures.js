export const generationCreatures = {
  Children: [{ id: 'children-fallback', file: null }],
  Teenagers: [{ id: 'teenagers-fallback', file: null }],
  Adult: [{ id: 'adult-fallback', file: null }],
  'Young Man': [{ id: 'young-man-fallback', file: null }],
  'Old/Senior': [{ id: 'senior-fallback', file: null }],
  'Gen Z': [{ id: 'gen-z-fallback', file: null }],
  'Gen Alpha': [{ id: 'gen-alpha-fallback', file: null }],
};

export function getCreatures(generation) {
  return generationCreatures[generation] || generationCreatures.Adult;
}
