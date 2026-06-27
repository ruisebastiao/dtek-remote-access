# Modelo de Seguranca

## Principios

- Nao expor RDP, SSH, PLCs, HMIs ou robots diretamente na internet.
- Acesso sempre autenticado e autorizado.
- Permissoes por cliente/site/equipamento/porta.
- Chaves temporarias para enrolment.
- Auditoria de todas as operacoes administrativas.
- Separar dados de clientes.

## Origem dos Utilizadores

O `dtek-webhub` e a unica fonte de identidade:

- cria e gere utilizadores;
- associa utilizadores a clientes/empresas;
- define roles globais `root`, `admin` e `member`;
- define entitlements por plataforma, incluindo `remote_access`.

O `dtek-remote-access` nao cria utilizadores proprios. Recebe o utilizador via
SSO/cookie/JWT do Hub e guarda apenas configuracao operacional especifica da
VPN, como sites permitidos, gateways, equipamentos, grants e auditoria.

Headscale tambem nao deve ser usado como diretorio de utilizadores de negocio.
O user Headscale `dreamfortek` e tecnico/operacional da tailnet; a gestao real
de pessoas continua no Hub.

## Roles da Plataforma

| Role | Permissoes |
|---|---|
| root | tudo, incluindo integracoes globais Headscale, politicas e operacoes destrutivas |
| admin | gerir sites, gateways, equipamentos, enrolment keys, rotas, nodes, grants e auditoria |
| operator | ver estado e operar acessos permitidos, sem alterar configuracao estrutural da VPN |
| viewer | ver clientes/sites/equipamentos autorizados e estado online/offline, sem alterar VPN |

As roles devem vir do `dtek-webhub` via SSO/claims em
`platforms.remote_access`.

Regra base: utilizadores normais nao alteram configuracoes de VPN. Por
seguranca, apenas `admin`/`root` podem:

- criar ou revogar auth/preauth keys;
- aprovar/revogar nodes;
- aprovar/revogar rotas;
- criar/editar gateways;
- alterar ACLs/politicas;
- atribuir grants a outros utilizadores;
- alterar configuracoes globais do adapter Headscale.

`operator` pode executar fluxos operacionais previamente autorizados. `viewer`
e leitura apenas.

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
