import "./globals.css";
import { Inter } from "next/font/google"; // Use standard next/font

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Hydra Pool Villa",
    description: "Best Pool Villas for You",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
