const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

const DARK_GREEN = 'rgb(44, 75, 66)';
const GOLD = 'rgb(194, 164, 91)';
const RED = 'rgb(237, 41, 57)';
const LIGHT_GREY = '#f1f5f9';
const WHITE = '#ffffff';
const BLACK = '#0f172a';
const GREY = '#64748b';

export default {
  light: {
    text: BLACK,
    background: LIGHT_GREY,
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: DARK_GREEN,
    accent: GOLD,
    danger: RED,
    cardText: BLACK,
    cardRed: RED,
    white: WHITE,
    grey: GREY,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: DARK_GREEN,
    accent: GOLD,
    danger: RED,
    cardText: BLACK,
    cardRed: RED,
    white: WHITE,
    grey: GREY,
  },
};
