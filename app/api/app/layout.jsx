import "./globals.css";
export const metadata = {
  title: "The Desk 2.0",
  description: "Macro / sector / positioning engine",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0d12" }}>{children}</body>
    </html>
  );
}
