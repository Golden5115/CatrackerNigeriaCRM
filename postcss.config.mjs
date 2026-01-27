/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- THIS IS THE CHANGE
    autoprefixer: {},
  },
};

export default config;