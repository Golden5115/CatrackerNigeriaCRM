import { Inter } from "next/font/google"; // 1. Import Inter
import "./globals.css";

// 2. Configure it
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CTN CRM", // <--- CHANGE YOUR BROWSER TAB TITLE HERE
  description: "Workflow Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 3. Apply it to the body */}
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}