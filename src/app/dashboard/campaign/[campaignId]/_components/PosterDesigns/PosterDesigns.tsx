import Image from "next/image";

import type { PosterDesignWithUrl } from "@/data/campaigns";

import CreatePosterDesignDialog from "../CreatePosterDesignDialog/CreatePosterDesignDialog";
import styles from "./PosterDesigns.module.css";

interface PosterDesignsProps {
  posterDesigns: PosterDesignWithUrl[];
}

export default function PosterDesigns({ posterDesigns }: PosterDesignsProps) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Poster Designs:</h2>
      <div className={styles.posterDesignsGrid}>
        {posterDesigns.map((posterDesign) => (
          <Image
            key={posterDesign.id}
            width={176}
            height={249}
            src={posterDesign.designUrl}
            unoptimized
            alt="Poster design"
            className={styles.posterDesignImage}
          />
        ))}
        <CreatePosterDesignDialog />
      </div>
    </div>
  );
}
