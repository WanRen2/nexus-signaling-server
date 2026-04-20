import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexus Signaling Server',
  description: 'WebRTC signaling server for Nexus P2P messenger',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}