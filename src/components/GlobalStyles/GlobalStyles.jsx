// GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* 1. Use a more-intuitive box-sizing model */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  /* 2. Remove default margin */
  *:not(dialog) {
    margin: 0;
  }
  
  /* 3. Enable keyword animations */
  @media (prefers-reduced-motion: no-preference) {
    html {
      interpolate-size: allow-keywords;
    }
  }
  
  body {
    /* 4. Increase line-height */
    line-height: 1.5;
    /* 5. Improve text rendering */
    -webkit-font-smoothing: antialiased;
  }
  
  /* 6. Improve media defaults */
  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
  }
  
  /* 7. Inherit fonts for form controls */
  input, button, textarea, select {
    font: inherit;
  }
  
  /* 8. Avoid text overflows */
  p, h1, h2, h3, h4, h5, h6 {
    overflow-wrap: break-word;
  }
  
  /* 9. Improve line wrapping */
  p {
    text-wrap: pretty;
  }
  h1, h2, h3, h4, h5, h6 {
    text-wrap: balance;
  }
  
  html{
    --color-blue-50: hsl(213.75, 96.49%, 96.79%);
    --color-blue-50: oklch(97% 0.014 254.604);
    
    --color-blue-100: hsl(214.28, 96.22%, 92.78%);
    --color-blue-100: oklch(93.2% 0.032 255.585);
    
    --color-blue-200: hsl(213.33, 100%, 87.28%);
    --color-blue-200: oklch(88.2% 0.059 254.128);
    
    --color-blue-300: hsl(213.33, 100%, 87.28%);
    --color-blue-300: oklch(80.9% 0.105 251.813);
    
    --color-blue-400: hsl(212.79, 100%, 66.84%);
    --color-blue-400: oklch(70.7% 0.165 254.624);
    
    --color-blue-500: hsl(216.89, 100%, 59.61%);
    --color-blue-500: oklch(62.3% 0.214 259.815);
    
    --color-blue-600: hsl(221.34, 97.06%, 53.5%);
    --color-blue-600: oklch(54.6% 0.245 262.881);
    
    --color-blue-700: hsl(225.35, 84.1%, 48.98%);
    --color-blue-700: oklch(48.8% 0.243 264.376);
    
    --color-blue-800: hsl(227.1, 75.74%, 41.14%);
    --color-blue-800: oklch(42.4% 0.199 265.638);
    
    --color-blue-900: hsl(224.86, 67.28%, 33.33%);
    --color-blue-900: oklch(37.9% 0.146 265.522);
    
    --color-blue-950: hsl(226.51, 58.74%, 21.15%);
    --color-blue-950: oklch(28.2% 0.091 267.935);

    --color-orange-50: hsl(33.33, 100%, 96.51%);
    --color-orange-50: oklch(98% 0.016 73.684);
    
    --color-orange-100: hsl(34.29, 100%, 91.68%);
    --color-orange-100: oklch(95.4% 0.038 75.164);
    
    --color-orange-200: hsl(32.18, 100%, 82.86%);
    --color-orange-200: oklch(90.1% 0.076 70.697);
    
    --color-orange-300: hsl(30.98, 100%, 71.25%);
    --color-orange-300: oklch(83.7% 0.128 66.29);
    
    --color-orange-400: hsl(31.43, 100%, 51.32%);
    --color-orange-400: oklch(75% 0.183 55.934);
    
    --color-orange-500: hsl(29.2, 100%, 42.64%);
    --color-orange-500: oklch(70.5% 0.213 47.604);
    
    --color-orange-600: hsl(23.81, 100%, 40.32%);
    --color-orange-600: oklch(64.6% 0.222 41.116);
    
    --color-orange-700: hsl(20.51, 100%, 34.78%);
    --color-orange-700: oklch(55.3% 0.195 38.402);
    
    --color-orange-800: hsl(17.27, 100%, 31.01%);
    --color-orange-800: oklch(47% 0.157 37.304);
    
    --color-orange-900: hsl(15.99, 83.12%, 27.04%);
    --color-orange-900: oklch(40.8% 0.123 38.172);
    
    --color-orange-950: hsl(12.88, 84.81%, 14.42%);
    --color-orange-950: oklch(26.6% 0.079 36.259);

    --spacing-0: 0px;
    --spacing-1: 4px;
    --spacing-2: 8px;
    --spacing-3: 12px;
    --spacing-4: 16px;
    --spacing-5: 20px;
    --spacing-6: 24px;
    --spacing-7: 28px;
    --spacing-8: 32px;
    --spacing-9: 36px;
    --spacing-10: 40px;
    --spacing-12: 48px;
    --spacing-14: 56px;
    --spacing-16: 64px;
    --spacing-20: 80px;
    --spacing-24: 96px;
    
  }
`;

export default GlobalStyles;