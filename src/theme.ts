export const colors = {
  bg: '#f4f5f7', surface: '#ffffff', surface2: '#f8f9fb',
  border: '#e2e5ea', borderStrong: '#cfd4dc',
  text: '#1f2430', text2: '#5b6472', text3: '#8a92a0',
  blue: '#2563eb', blueBg: '#e8f0fe', blueText: '#1746a2',
  amber: '#d97706', amberBg: '#fef3e2', amberText: '#92580a',
  teal: '#0d9488', tealBg: '#e0f2f1', tealText: '#0a6e64',
  green: '#16a34a', greenBg: '#e6f4ea', greenText: '#12723a',
  purple: '#7c3aed', purpleBg: '#f0e9ff', purpleText: '#5b21b6',
  grayBg: '#eef0f3', grayText: '#545b68',
  red: '#dc2626', redBg: '#fdecec',
  white: '#ffffff',
};

export const colorSets: Record<string, { bg: string; text: string; dot: string }> = {
  purple: { bg: colors.purpleBg, text: colors.purpleText, dot: colors.purple },
  amber: { bg: colors.amberBg, text: colors.amberText, dot: colors.amber },
  blue: { bg: colors.blueBg, text: colors.blueText, dot: colors.blue },
  teal: { bg: colors.tealBg, text: colors.tealText, dot: colors.teal },
  green: { bg: colors.greenBg, text: colors.greenText, dot: colors.green },
};

export const radius = 12;
