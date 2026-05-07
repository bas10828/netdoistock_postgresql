// app/layout.js
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: "Netdoi Technology",
  description: "netdoi",
  icons: {
    icon: '/logo.png?v=1', // ใส่ไอคอนที่นี่
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
