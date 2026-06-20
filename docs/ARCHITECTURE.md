# Arquitetura

## Objetivo

O `dtek-remote-access` e a aplicacao de gestao para acesso remoto industrial. O
Headscale/Tailscale fornece a rede privada; este repo fornece a camada de
produto: clientes, sites, gateways, equipamentos, permissoes e auditoria.

## Componentes

```text
Browser tecnico/admin
  -> dtek-webhub SSO
  -> dtek-remote-access frontend
  -> dtek-remote-access backend
  -> Headscale
  -> Tailscale clients/gateways
  -> rede industrial do cliente
```

### dtek-webhub

Responsavel por:

- Login e SSO.
- Identidade de utilizador.
- Clientes e permissoes globais do ecossistema.
- Launcher para a plataforma de VPN/Remote Access.

### dtek-remote-access

Responsavel por:

- Inventario de clientes, sites, gateways e equipamentos.
- Geracao de auth/preauth keys de curta duracao.
- Sincronizacao com Headscale: users, nodes, routes, ACLs.
- Estado operacional dos gateways.
- Auditoria.
- UI de administracao.

### Headscale

Responsavel por:

- Control plane Tailscale.
- Registo de nodes.
- Mapa da tailnet.
- Auth keys.
- Aprovar rotas anunciadas.
- Politicas ACL no formato suportado.

O Headscale nao deve ser tratado como base de dados de produto. A fonte
funcional para clientes/sites/equipamentos fica no `dtek-remote-access`; o
Headscale e sincronizado como motor de rede.

### Gateway industrial

Dispositivo instalado no cliente, por exemplo:

- Raspberry Pi.
- Mini-PC industrial.
- Jetson/IPC Linux.
- PC embebido em quadro eletrico.

Responsavel por:

- Correr Tailscale.
- Anunciar rotas da LAN industrial quando autorizado.
- Reportar estado ao `dtek-remote-access`.
- Opcionalmente descobrir equipamentos locais.
- Opcionalmente fornecer funcoes de diagnostico local.

## Fluxo de Enrolment

```text
Admin cria Cliente/Site/Gateway
  -> backend gera preauth key curta no Headscale
  -> UI mostra comando ou ficheiro bootstrap
  -> gateway instala agente + Tailscale
  -> gateway entra na tailnet
  -> backend associa node Headscale ao gateway
  -> admin aprova rotas/equipamentos
```

## Modos de Acesso

### VPN completa

O tecnico usa Tailscale no seu PC e acede ao equipamento com ferramentas
nativas:

- RDP.
- SSH.
- Browser HMI.
- TIA Portal.
- Epson RC+.
- RoboDK.
- Ferramentas de PLC/robot proprietarias.

Este e o modo prioritario para automacao industrial.

### Acesso via browser

Fase futura. Possiveis integracoes:

- WebSSH.
- noVNC.
- Apache Guacamole.
- Reverse proxy temporario para Web HMIs.

Este modo e conveniente, mas nao substitui ferramentas industriais nativas.

## Separacao de Responsabilidades

`dtek-server-management`:

- Onde o Headscale corre.
- DNS/port-forward/TLS.
- Backups do servidor.
- Runbooks operacionais.

`dtek-remote-access`:

- Produto e dados funcionais.
- UI/API.
- Integracao com Headscale.
- Agente industrial.
- Modelo de seguranca e auditoria.
