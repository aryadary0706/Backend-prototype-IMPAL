import "@/styles/globals.css";

export const metadata = {
  title: "Plantdoc - Plant Disease Identification",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
