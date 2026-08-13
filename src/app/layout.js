import "./global.css";
import {DM_Sans, Sora} from "next/font/google";

export const metadata = {
  title: "PosterTrace",
};

const dm_sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dm_sans.variable} ${sora.variable}`}>
      <head>
        <title>PosterTrace</title>
      </head>
      <body style={{fontFamily:"var(--font-dm-sans)"}}>{children}</body>
    </html>
  );
}