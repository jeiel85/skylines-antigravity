import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';

// 빌드 산출물(JS/CSS) 목록을 서비스워커 프리캐시용 precache-manifest.js로 내보낸다.
// 첫 방문 후 오프라인으로 실행해도 번들이 캐시에 있도록 sw.js가 install 단계에서 읽는다.
function precacheManifest() {
  return {
    name: 'precache-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((fileName) => /\.(js|css)$/.test(fileName))
        .sort();
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
      const manifest = { version, files: files.map((fileName) => `./${fileName}`) };
      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.js',
        source: `self.__PRECACHE_MANIFEST = ${JSON.stringify(manifest)};\n`
      });
    }
  };
}

export default defineConfig({
  plugins: [precacheManifest()],
  base: './',
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});
