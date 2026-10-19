import "./globals.css";

export const metadata = {
  title: "Number Forge — Make the Target",
  description:
    "A focused mental-math game: combine four numbers to hit the target.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
