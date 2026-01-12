module.exports = {
  content: ['./public/*.html', './public/*.js'],
  theme: {
    extend: {
      colors: {
        ink: '#1b1b1b',
        moss: '#1f4d4a',
        clay: '#f2d2a2',
        sunrise: '#f6b37f',
        paper: '#f7f1e6',
      },
      fontFamily: {
        display: ['"Cinzel"', '"Garamond"', 'serif'],
        body: ['"Source Sans 3"', '"Trebuchet MS"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 25px 60px rgba(31, 77, 74, 0.2)',
      },
      backgroundImage: {
        aura:
          'radial-gradient(circle at 10% 20%, rgba(31, 77, 74, 0.25), transparent 55%), radial-gradient(circle at 80% 15%, rgba(246, 179, 127, 0.4), transparent 50%), linear-gradient(135deg, #f9f3e8 0%, #f2d2a2 55%, #e5c29b 100%)',
      },
    },
  },
  plugins: [],
};
