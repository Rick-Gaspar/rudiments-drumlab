# Roadmap — Fase 4 (PWA, offline, confiabilidade)

- [ ] Instalar vite-plugin-pwa e configurar service worker (generateSW, /sw.js, autoUpdate, injectRegister: null, devOptions off)
- [ ] Manifest válido (nome, cores, standalone, start_url) + ícones reais (192, 512, maskable, apple-touch)
- [ ] Wrapper de registro com guards (PROD, iframe, previews Lovable, ?sw=off) + testes do guard
- [ ] Indicador de offline e prompt de instalação (beforeinstallprompt + instruções iOS), textos em pt-BR
- [ ] Cache de fontes Google e navegação NetworkFirst; dados do usuário fora do cache
- [ ] Build de produção, typecheck, lint, testes; inspecionar manifest/sw gerados
- [ ] Testar build de produção (offline, metronomo, sessões) e relatório de prontidão
- [ ] Testes de página: datas pt-BR em Progresso, histórico e sessão em vários fusos
