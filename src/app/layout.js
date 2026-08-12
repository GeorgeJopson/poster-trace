import "./global.css";
import {DM_Sans, Cascadia_Mono} from "next/font/google";

export const metadata = {
  title: "PosterTrace",
};

const dm_sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const cascadia_mono = Cascadia_Mono({
  subsets: ['latin'],
  variable: '--font-cascadia-mono',
})


export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dm_sans.variable} ${cascadia_mono.variable}`}>
      <head>
        <title>PosterTrace</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
