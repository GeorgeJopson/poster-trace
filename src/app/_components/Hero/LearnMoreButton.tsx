"use client";

import React from "react";
import Button from "@/components/Button";

interface LearnMoreButtonProps {
  children: React.ReactNode;
  /** `id` of the element to scroll to. */
  targetId: string;
}

// The only interactive part of the hero, kept separate so the rest of the
// landing page can stay as server components.
export default function LearnMoreButton({
  children,
  targetId,
}: LearnMoreButtonProps) {
  return (
    <Button
      variant={"transparent"}
      fontSize={`var(--learn-more-btn-size)`}
      onClick={() => {
        const target = document.getElementById(targetId);
        if (target) {
          window.scrollTo({
            behavior: "smooth",
            top:
              target.getBoundingClientRect().top -
              document.body.getBoundingClientRect().top -
              46,
          });
        }
      }}
    >
      {children}
    </Button>
  );
}
