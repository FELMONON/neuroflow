import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0B0F",
};

export const metadata: Metadata = {
  title: {
    default: "NeuroFlow — Your external prefrontal cortex",
    template: "%s — NeuroFlow",
  },
  description:
    "Task management, focus tools, and habit tracking designed for how your ADHD brain actually works. Break tasks down, stay focused, build streaks that bend instead of break.",
  metadataBase: new URL("https://neuroflow.app"),
  openGraph: {
    title: "NeuroFlow — Your external prefrontal cortex",
    description:
      "Task management, focus tools, and habit tracking designed for how your ADHD brain actually works.",
    siteName: "NeuroFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroFlow — Your external prefrontal cortex",
    description:
      "Task management, focus tools, and habit tracking designed for how your ADHD brain actually works.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
