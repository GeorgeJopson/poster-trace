import type { PosterDesignDto } from "@application/dto/PosterDesignDto";

import CreatePosterDesignDialog from "../CreatePosterDesignDialog/CreatePosterDesignDialog";
import GeneratePostersDialog from "../GeneratePostersDialog/GeneratePostersDialog";
import styles from "./PosterDesigns.module.css";

interface PosterDesignsProps {
  posterDesigns: PosterDesignDto[];
}

export default function PosterDesigns({ posterDesigns }: PosterDesignsProps) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Poster Designs:</h2>
      <div className={styles.posterDesignsGrid}>
        {posterDesigns.map((posterDesign, index) => (
          <GeneratePostersDialog
            key={posterDesign.id}
            posterDesign={posterDesign}
            designLabel={`Poster design ${index + 1}`}
          />
        ))}
        <CreatePosterDesignDialog />
      </div>
    </div>
  );
}
