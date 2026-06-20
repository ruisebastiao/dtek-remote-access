# Modelo de Seguranca

## Principios

- Nao expor RDP, SSH, PLCs, HMIs ou robots diretamente na internet.
- Acesso sempre autenticado e autorizado.
- Permissoes por cliente/site/equipamento/porta.
- Chaves temporarias para enrolment.
- Auditoria de todas as operacoes administrativas.
- Separar dados de clientes.

## Roles Iniciais

| Role | Permissoes |
|---|---|
| root | tudo |
| vpn_admin | gerir clientes, gateways, rotas, ACLs |
| vpn_operator | ver estado e criar acessos temporarios permitidos |
| technician | usar acessos atribuidos |
| customer_viewer | ver estado do seu site, sem alterar VPN |

As roles devem vir do `dtek-webhub` via SSO/claims.

## Grants

Um grant define:

- Utilizador ou grupo.
- Cliente/site.
- Equipamento ou subnet.
- Portas/protocolos.
- Janela temporal.
- Motivo/ticket opcional.

Exemplo:

```text
rui -> Maxiplas / Linha 1 / HMI LONG_SIDE / tcp:3389 / 2026-06-20 14:00-18:00
```

## ACLs

O manager converte grants em politica Headscale. A politica deve ser gerada,
validada, guardada e auditada.

Nao editar ACLs manualmente em producao sem sincronizar de volta para o
manager.

## Segredos

Nunca commitar:

- Auth/preauth keys.
- API keys do Headscale.
- Tokens Cloudflare.
- SSH private keys.
- Credenciais de clientes.

Guardar segredos em:

- `.env` local git-ignored.
- Secret manager futuro.
- Volumes protegidos no servidor.

## Auditoria

Eventos obrigatorios:

- Criacao/revogacao de auth key.
- Enrolment de gateway.
- Aprovar/revogar node.
- Aprovar/revogar rota.
- Criar/alterar/remover grant.
- Aplicar ACL.
- Login/uso administrativo.

Campos minimos:

- Timestamp.
- Actor.
- Acao.
- Entidade.
- Antes/depois quando aplicavel.
- IP/origem.

## Riscos Especificos Industriais

- Rotas sobrepostas entre clientes.
- Tecnico com acesso a rede errada.
- Gateway roubado ou perdido.
- PLC/HMI antigo sem hardening.
- Ferramentas de engenharia que fazem broadcast/scan agressivo.

Mitigacoes:

- Rotas por cliente validadas.
- Grants minimos por porta.
- Revogacao rapida de nodes.
- Inventario claro de equipamentos.
- Janelas temporais.
