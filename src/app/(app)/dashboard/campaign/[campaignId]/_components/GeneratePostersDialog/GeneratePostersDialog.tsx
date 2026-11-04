"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";

import type { PosterDesignDto } from "@application/dto/PosterDesignDto";
import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";
import DesignPreview from "@/components/DesignPreview";
import { routeNames } from "@/routeNames";
import downloadFile from "@/utils/downloadFile";
import drawPosterPdf from "@/utils/drawPosterPdf";

import { generatePosters } from "../../actions";
import {
  useCampaignId,
  useCampaignName,
  useCampaignTarget,
} from "../CampaignContext";
import styles from "./GeneratePostersDialog.module.css";
import { MAX_POSTERS_PER_REQUEST } from "./limits";

interface GeneratePostersDialogProps {
  posterDesign: PosterDesignDto;
  /** Describes the design's preview, like an image's alt text. */
  designLabel: string;
}

/** Characters that aren't allowed in file names on common systems. */
const UNSAFE_FILENAME_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f]/g;

function pdfFilename(campaignName: string, count: number) {
  const name = campaignName.replace(UNSAFE_FILENAME_CHARACTERS, "").trim();
  const posters = count === 1 ? "1 poster" : `${count} posters`;
  return `${name || "Campaign"} - ${posters}.pdf`;
}

async function fetchDesignImage(designId: string) {
  const response = await fetch(routeNames.posterDesignImage(designId));
  if (!response.ok) {
    throw new Error(`The design image failed to load (${response.status})`);
  }
  return {
    data: await response.arrayBuffer(),
    contentType: response.headers.get("Content-Type") ?? "",
  };
}

/**
 * A poster design's card, which opens a dialog to generate posters from it.
 * The posters are generated on the server, then the PDF is drawn here in the
 * browser (see ADR-0010) and downloaded.
 */
export default function GeneratePostersDialog({
  posterDesign,
  designLabel,
}: GeneratePostersDialogProps) {
  const campaignId = useCampaignId();
  const campaignName = useCampaignName();
  const target = useCampaignTarget();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setError(null);
    setOpen(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        // Fetched alongside generating, as both take a moment.
        const [posters, image] = await Promise.all([
          generatePosters(campaignId, posterDesign.id, formData),
          fetchDesignImage(posterDesign.id),
        ]);
        const pdf = await drawPosterPdf(
          { ...image, qrPlacement: posterDesign.qrPlacement },
          posters,
        );
        downloadFile(
          new Blob([pdf], { type: "application/pdf" }),
          pdfFilename(campaignName, posters.length),
        );
        setOpen(false);
      } catch (cause) {
        // Let a redirect to log in through.
        unstable_rethrow(cause);
        setError("The posters couldn't be generated. Please try again.");
      }
    });
  }

  return (
    <CentralDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Generate posters"
      trigger={
        <button type="button" className={styles.card}>
          <DesignPreview
            width={176}
            height={249}
            posterDesign={posterDesign}
            url={target}
            aria-label={designLabel}
            className={styles.preview}
          />
          <span className={styles.cardLabel}>Generate Posters</span>
        </button>
      }
    >
      <form className={styles.form} action={handleSubmit}>
        <p className={styles.description}>
          Each poster gets its own QR code, so you can see which one was
          scanned. They download as a PDF, one A4 page per poster.
        </p>
        <div className={styles.fields}>
          <label className={styles.label} htmlFor="posterCount">
            Number of posters
          </label>
          <input
            className={styles.input}
            id="posterCount"
            name="count"
            type="number"
            min={1}
            max={MAX_POSTERS_PER_REQUEST}
            step={1}
            defaultValue={1}
            required
          />
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.submitButtonWrapper}>
          <Button
            variant={"filled"}
            fontSize={"1.5rem"}
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Generating…" : "Generate"}
          </Button>
        </div>
      </form>
    </CentralDialog>
  );
}
