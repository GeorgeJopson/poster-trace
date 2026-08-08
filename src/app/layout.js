import GlobalStyles from "@/components/GlobalStyles";

export const metadata = {
  title: "PosterTrace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>PosterTrace</title>
        <GlobalStyles/>
      </head>
      <body>{children}</body>
    </html>
  );
}
