import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PANTAS App',
    short_name: 'PANTAS',
    description: 'Aplikasi Grading Panen AI dan Marketplace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#40916c',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
