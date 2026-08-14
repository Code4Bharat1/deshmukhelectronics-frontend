import './globals.css';

export const metadata = {
  title: 'Deshmukh Electronics — Warehouse & Team App',
  description: 'Full-stack warehouse management, inventory tracking, attendance, and salary management for Deshmukh Electronics.',
  keywords: 'warehouse management, inventory, electronics, attendance, salary',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Deshmukh Electronics — Warehouse & Team App',
    description: 'Warehouse management and team operations platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-800" suppressHydrationWarning>{children}</body>
    </html>
  );
}
