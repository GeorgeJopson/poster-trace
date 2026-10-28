import type { PosterDesignDto } from "@application/dto/PosterDesignDto";
import DesignPreview from "@/components/DesignPreview";

import CreatePosterDesignDialog from "../CreatePosterDesignDialog/CreatePosterDesignDialog";
import styles from "./PosterDesigns.module.css";

interface PosterDesignsProps {
  posterDesigns: PosterDesignDto[];
  /** The URL the designs' QR codes point to. */
  target: string;
}

export default function PosterDesigns({
  posterDesigns,
  target,
}: PosterDesignsProps) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Poster Designs:</h2>
      <div className={styles.posterDesignsGrid}>
        {posterDesigns.map((posterDesign, index) => (
          <DesignPreview
            key={posterDesign.id}
            width={176}
            height={249}
            posterDesign={posterDesign}
            url={target}
            aria-label={`Poster design ${index + 1}`}
            className={styles.posterDesignImage}
          />
        ))}
        <CreatePosterDesignDialog />
      </div>
    </div>
  );
}
