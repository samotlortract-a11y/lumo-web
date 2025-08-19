/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        lumoGreen: "#C2DC80",
        lumoPink:  "#EA9CAF",
        lumoBerry: "#D56989",
        lumoBg:    "#F3EEF1"
      },
      borderRadius: { 'xl2': '1.25rem' }
    }
  },
  plugins: []
}
