import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neonblast.zero',
  appName: 'Neon Blast Zero',
  webDir: 'dist',
  backgroundColor: '#050508',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050508'
    }
  }
};

export default config;
