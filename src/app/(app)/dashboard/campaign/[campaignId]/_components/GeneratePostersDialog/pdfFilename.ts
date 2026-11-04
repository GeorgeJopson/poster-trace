/** Characters that aren't allowed in file names on common systems. */
const UNSAFE_FILENAME_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f]/g;

/** The name a campaign's generated posters download as. */
export default function pdfFilename(campaignName: string, count: number) {
  const name = campaignName.replace(UNSAFE_FILENAME_CHARACTERS, "").trim();
  const posters = count === 1 ? "1 poster" : `${count} posters`;
  return `${name || "Campaign"} - ${posters}.pdf`;
}
