import type { Metadata, Viewport } from "next";
import { MallRoot } from "@/components/MallRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopNet · Fashion Mall",
  description: "Walk through the ShopNet fashion mall and shop each section.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e9e6e0",
};

/** The 3D mall lives in the root layout, so it stays mounted while shop routes open over it. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MallRoot />
        {children}
      </body>
    </html>
  );
}
