import "./styles.css";

export const metadata = { title: "Threads to Income Analytics", description: "Private GA4 dashboard" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
