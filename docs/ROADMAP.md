# Roadmap

## Fase 0 - Arquitetura e Contratos

- Fechar terminologia: customer, site, gateway, industrial device, access grant.
- Definir dados locais e mapeamento para Headscale.
- Definir regras de seguranca e auditoria.
- Definir formato de bootstrap do gateway.

Resultado: docs e contratos suficientes para implementar sem ambiguidade.

## Fase 1 - MVP Manual Assistido

Backend inicial:

- CRUD de clientes/sites/gateways/equipamentos.
- Guardar mapping entre gateway e Headscale node id.
- Gerar instrucoes de instalacao para gateway.
- Criar preauth key via Headscale.
- Listar nodes e rotas vindas do Headscale.
- Aprovar/revogar rotas.

UI inicial:

- Lista de clientes.
- Detalhe de site.
- Gateways online/offline.
- Equipamentos por gateway.
- Botao para gerar enrolment.

Sem ACLs complexas nesta fase; apenas operadores admin.

## Fase 2 - Agente de Gateway

Agente para Linux embebido:

- Instalar/configurar Tailscale.
- Registar hostname e metadados.
- Reportar heartbeat.
- Reportar IPs locais, interfaces e rotas.
- Aplicar configuracao recebida: advertise routes, tags, labels.

Target inicial:

- Raspberry Pi OS / Debian.
- Ubuntu Server.
- Mini-PC industrial Linux.

## Fase 3 - ACLs e Acessos por Cliente

- Modelo de grants por utilizador/equipamento/porta.
- Geracao de politica ACL Headscale.
- Janelas temporais de acesso.
- Revogacao de acessos.
- Auditoria de alteracoes.

## Fase 4 - Integracao Completa com Hub

- SSO via cookie/JWT do `dtek-webhub`.
- Clientes e utilizadores sincronizados do Hub.
- Role por plataforma: `platforms.vpn`.
- Launcher no Hub para "Remote Access".

## Fase 5 - Experiencia Tipo EasyAccess

- Dashboard por cliente/site.
- Estado visual dos gateways/equipamentos.
- Acesso rapido por ferramenta: RDP, SSH, Web HMI, VNC.
- Geracao de comandos para tecnico.
- Historico de sessoes.

## Fase 6 - Hardening

- Backup/restore testado.
- Rotacao de keys.
- Alertas de gateway offline.
- Deteccao de rotas sobrepostas entre clientes.
- Politicas por tenant.
- Logs imutaveis ou exportaveis.

## Fase 7 - Acesso Browser Opcional

- WebSSH.
- noVNC/Guacamole.
- Reverse proxy temporario para HTTP/HTTPS internos.
- Sessao com expiracao e auditoria.
