import Image from "next/image";

import type { PosterDesignModel } from "@/generated/prisma/models";

import CreatePosterDesignDialog from "../CreatePosterDesignDialog/CreatePosterDesignDialog";
import styles from "./PosterDesigns.module.css";

interface PosterDesignsProps {
  posterDesigns: PosterDesignModel[];
}

export default function PosterDesigns({ posterDesigns }: PosterDesignsProps) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Poster Designs:</h2>
      <div className={styles.grid}>
        {posterDesigns.map((posterDesign) => (
          <Image
            key={posterDesign.id}
            width={176}
            height={249}
            src={`data:image/png;base64,${posterDesign.design.toBase64()}`}
            alt="Poster design"
            className={styles.posterDesignImage}
          />
        ))}
        <CreatePosterDesignDialog />
      </div>
    </div>
  );
}
