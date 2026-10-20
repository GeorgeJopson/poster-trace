import React from "react";
import { useSpring } from "@react-spring/web";
import usePrefersReducedMotion from "@/utils/usePrefersReducedMotion";

// Unlike useBoop, the rotation is held for as long as the element is
// hovered or focused, and only springs back once both have ended.
export default function useHoverRotation({
  rotation = 10,
  springConfig = {
    tension: 300,
    friction: 10,
  },
}): [
  object,
  {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  },
] {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const isActive = isHovered || isFocused;

  const style = useSpring({
    transform: `rotate(${isActive ? rotation : 0}deg)`,
    config: springConfig,
  });

  const handlers = React.useMemo(
    () => ({
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
    }),
    [],
  );

  const appliedStyle = prefersReducedMotion ? {} : style;

  return [appliedStyle, handlers];
}
