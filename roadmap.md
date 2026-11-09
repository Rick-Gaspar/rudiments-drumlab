# Roadmap — Fase 4 (PWA, offline, confiabilidade)

- [x] Instalar vite-plugin-pwa e configurar service worker (generateSW, /sw.js, autoUpdate, injectRegister: null, devOptions off)
- [x] Manifest válido (nome, cores, standalone, start_url) + ícones reais (192, 512, maskable, apple-touch)
- [x] Wrapper de registro com guards (PROD, iframe, previews Lovable, ?sw=off) + testes do guard
- [x] Indicador de offline e prompt de instalação (beforeinstallprompt + instruções iOS), textos em pt-BR
- [x] Cache de fontes Google e navegação NetworkFirst; dados do usuário fora do cache
- [x] Build de produção, typecheck, lint, testes; inspecionar manifest/sw gerados
- [x] Testar build de produção (offline, metronomo, sessões) e relatório de prontidão
- [x] Testes de página: datas pt-BR em Progresso, histórico e sessão em vários fusos
