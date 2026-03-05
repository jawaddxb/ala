import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ALA - Choice-Conditioned Reflective Assistant",
  description: "A language model that separates factual answering from value framing. Your perspective, your choice.",
  keywords: ["AI", "assistant", "reflection", "perspective", "values", "choice"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Force dark mode — must run before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('dark');`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
