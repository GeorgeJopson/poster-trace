import "./global.css";
import {Nunito, Bungee} from "next/font/google";

export const metadata = {
  title: "PosterTrace",
};

const bungee = Bungee({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bungee',
  fallback: ['sans-serif'],
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  fallback: ['sans-serif'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bungee.variable} ${nunito.variable}`}>
      <head>
        <title>PosterTrace</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
