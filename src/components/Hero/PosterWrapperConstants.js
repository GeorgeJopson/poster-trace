const posterSize = 256;
const root2 = 1.414213562;

export const posterWrapperDefaults = `
  width: calc(${posterSize}px * var(--scale-factor));
  height: calc(${posterSize * root2}px * var(--scale-factor));
  position: relative;
`;