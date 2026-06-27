# Changelog - dtek-remote-access

Versionamento semantico (semver). Versao canonica = tag git `vX.Y.Z`, espelhada no ficheiro `VERSION` e na `version` do FastAPI.

## [0.1.0] - 2026-06-28

- Scaffold inicial FastAPI + UI estatica para gestao de acesso remoto industrial.
- Integracao com o Hub para identidade/entitlements e clientes vindos do Hub quando existe token real.
- Adapter Headscale read-only validado contra TowerV2, expondo nodes, IPs e rotas.
- Dockerfile e compose de producao para orquestracao via `dtek-webplatform`.
- Dev sem dados dummy persistidos; inventario local nasce vazio e VPN vem do Headscale real.
