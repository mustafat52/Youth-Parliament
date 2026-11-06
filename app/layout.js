import "./globals.css";

export const metadata = {
  title: "Youth Parliament Registration | ITM University, Raipur",
  description: "Register for the ITM University Raipur Youth Parliament and choose the politician you will represent.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#14213D" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
