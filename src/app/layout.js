import "./global.css";
import {Nunito, Bungee} from "next/font/google";
import StyledComponentsRegistry from "@/components/StyledComponentRegistry";

export const metadata = {
  title: "PosterTrace",
};

const bungee = Bungee({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bungee',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bungee.variable} ${nunito.variable}`}>
      <head>
        <title>PosterTrace</title>
      </head>
      <body style={{fontFamily:"var(--font-nunito)"}}>
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}