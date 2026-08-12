import "./global.css";
import {DM_Sans} from "next/font/google";

export const metadata = {
  title: "PosterTrace",
};

const dm_sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dm_sans.variable}`}>
      <head>
        <title>PosterTrace</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
