module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "Arial", "sans-serif"],
      },
      keyframes: {
        // Navbar animations
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        // Home animations
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDelay: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "50%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        // Navbar animations
        slideDown: "slideDown 0.3s ease-out",
        shine: "shine 0.8s ease-in-out",
        // Home animations
        fadeIn: "fadeIn 0.8s ease-out",
        fadeInDelay: "fadeInDelay 1.2s ease-out",
        scaleIn: "scaleIn 0.6s ease-out",
        fadeInUp: "fadeInUp 0.8s ease-out",
        slideInRight: "slideInRight 0.3s ease-out",
        slideInLeft: "slideInLeft 0.3s ease-out",
        slideOutRight: "slideOutRight 0.3s ease-out",
        slideOutLeft: "slideOutLeft 0.3s ease-out",
        gradient: "gradient 3s ease infinite",
        // Additional utility animationsy
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        // ===== RANGE SLIDER STYLING =====
        'input[type="range"]': {
          "-webkit-appearance": "none",
          appearance: "none",
          width: "100%",
          height: "8px",
          background: "transparent",
          cursor: "pointer",
          "pointer-events": "auto !important",
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          margin: "0",
          padding: "0",
        },

        // ===== WEBKIT THUMB =====
        'input[type="range"]::-webkit-slider-runnable-track': {
          background: "transparent",
          border: "none",
        },

        'input[type="range"]::-webkit-slider-thumb': {
          "-webkit-appearance": "none",
          appearance: "none",
          width: "24px",
          height: "24px",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          border: "3px solid white",
          "border-radius": "50%",
          cursor: "grab",
          "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.3)",
          transition: "all 0.15s ease",
          "pointer-events": "auto",
          "margin-top": "-8px",
        },

        'input[type="range"]::-webkit-slider-thumb:hover': {
          transform: "scale(1.3)",
          cursor: "grabbing",
          "box-shadow": "0 4px 16px rgba(59, 130, 246, 0.6)",
        },

        'input[type="range"]::-webkit-slider-thumb:active': {
          cursor: "grabbing",
          transform: "scale(1.4)",
        },

        // ===== FIREFOX THUMB =====
        'input[type="range"]::-moz-range-track': {
          background: "transparent",
          border: "none",
        },

        'input[type="range"]::-moz-range-progress': {
          background: "transparent",
          border: "none",
        },

        'input[type="range"]::-moz-range-thumb': {
          width: "24px",
          height: "24px",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          border: "3px solid white",
          "border-radius": "50%",
          cursor: "grab",
          "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.3)",
          transition: "all 0.15s ease",
          "pointer-events": "auto",
        },

        'input[type="range"]::-moz-range-thumb:hover': {
          transform: "scale(1.3)",
          cursor: "grabbing",
          "box-shadow": "0 4px 16px rgba(59, 130, 246, 0.6)",
        },

        'input[type="range"]::-moz-range-thumb:active': {
          cursor: "grabbing",
          transform: "scale(1.4)",
        },
      });
    },
  ],
};
