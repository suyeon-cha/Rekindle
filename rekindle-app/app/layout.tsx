import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rekindle — turn 'let's hang out' into a real plan",
  description: "AI-powered reconnection. rekindle finds the moment and writes the message.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
