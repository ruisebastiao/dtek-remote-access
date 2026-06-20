# dtek-remote-access

Gestao de acesso remoto industrial para o ecossistema DreamForTek.

O objetivo e criar uma camada propria, inspirada no conceito do EasyAccess, para
gerir clientes, sites, gateways industriais, equipamentos e permissoes de VPN.
O motor VPN previsto e Headscale/Tailscale; o `dtek-remote-access` e a consola de
gestao e integracao com o `dtek-webhub`.

## Visao

```text
dtek-webhub
  -> dtek-remote-access
  -> Headscale API/CLI
  -> Tailscale clients/gateways
  -> LAN industrial do cliente
  -> PLC/HMI/robot/PC industrial
```

Casos principais:

- Criar clientes e sites industriais.
- Registar gateways remotos, por exemplo Raspberry Pi, mini-PC industrial ou
  PC embebido.
- Associar equipamentos industriais a cada gateway/site.
- Emitir chaves de enrolment temporarias.
- Aprovar/revogar dispositivos.
- Gerir rotas anunciadas e ACLs.
- Dar acesso a tecnicos internos/externos por cliente, equipamento e janela de
  tempo.
- Auditar acessos e alteracoes.

## Repos Relacionados

- `dtek-server-management`: instalacao real do Headscale, TowerV2, DNS,
  port-forward, backups e runbooks operacionais.
- `dtek-webhub`: identidade, SSO, clientes, utilizadores e launcher.
- `dtek-ai-framework` / `dtek-helpdesk`: service providers do hub que servem de
  referencia para padrao FastAPI + Angular + Postgres.

## Documentacao

- [Arquitetura](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Integracao Headscale](docs/HEADSCALE_INTEGRATION.md)
- [Agente de dispositivo](docs/DEVICE_AGENT.md)
- [Modelo de seguranca](docs/SECURITY_MODEL.md)
- [Modelo de dados e API](docs/DATA_MODEL_API.md)
- [Comparacao com EasyAccess](docs/EASYACCESS_COMPARISON.md)

## Estado

Fase inicial de produto. Ainda nao existe implementacao backend/frontend neste
repo. O primeiro objetivo e fechar a arquitetura e os contratos antes de ligar
ao Headscale real.
