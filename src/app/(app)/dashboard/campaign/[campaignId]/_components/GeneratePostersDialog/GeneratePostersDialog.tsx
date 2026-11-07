"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { animated } from "@react-spring/web";

import type { PosterDesignDto } from "@application/dto/PosterDesignDto";
import Button from "@/components/Button";
import CentralDialog from "@/components/CentralDialog";
import DesignPreview from "@/components/DesignPreview";
import downloadFile from "@/utils/downloadFile";
import drawPosterPdf from "@/utils/poster-render/drawPosterPdf";
import useHoverRotation from "@/utils/useHoverRotation";

import { generatePosters } from "../../actions";
import {
  useCampaignId,
  useCampaignName,
  useSampleScanUrl,
} from "../CampaignContext";
import { MAX_POSTERS_PER_REQUEST } from "../../limits";
import fetchDesignImage from "./fetchDesignImage";
import styles from "./GeneratePostersDialog.module.css";
import pdfFilename from "./pdfFilename";

interface GeneratePostersDialogProps {
  posterDesign: PosterDesignDto;
  /** Describes the design's preview, like an image's alt text. */
  designLabel: string;
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
  const sampleScanUrl = useSampleScanUrl();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [labelStyle, hoverHandlers] = useHoverRotation({ rotation: 5 });

  function handleOpenChange(nextOpen: boolean) {
    setError(null);
    setOpen(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        // Fetched alongside generating, as both take a moment.
        const [result, image] = await Promise.all([
          generatePosters(campaignId, posterDesign.id, formData),
          fetchDesignImage(posterDesign.id),
        ]);
        if (result.error !== undefined) {
          setError(result.error);
          return;
        }
        const { posters } = result;
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
        <button type="button" className={styles.card} {...hoverHandlers}>
          <DesignPreview
            width={176}
            height={249}
            posterDesign={posterDesign}
            scanUrl={sampleScanUrl}
            aria-label={designLabel}
            className={styles.preview}
          />
          <span className={styles.cardLabel}>
            <animated.span style={labelStyle} className={styles.cardLabelText}>
              Generate Posters
            </animated.span>
          </span>
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
