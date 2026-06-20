# Integracao Headscale

## Papel do Headscale

Headscale e o control plane da VPN. O `dtek-remote-access` usa Headscale para:

- Criar auth/preauth keys.
- Listar nodes.
- Aprovar rotas.
- Revogar nodes.
- Gerar/aplicar ACLs.

Headscale nao deve armazenar conceitos de negocio como contrato, cliente,
site, tipo de equipamento ou permissao comercial. Esses conceitos ficam na base
do `dtek-remote-access`.

## Estrategia de Comunicacao

Fase inicial:

- Executar CLI localmente no servidor onde corre Headscale.
- O backend chama um adapter interno para `headscale` CLI ou API local.

Fase posterior:

- Usar API/gRPC quando a topologia permitir.
- Evitar depender de gRPC remoto se o Headscale estiver atras de reverse proxy.

## Entidades Mapeadas

| dtek-remote-access | Headscale |
|---|---|
| Customer | User/namespace ou metadata local |
| GatewayDevice | Node |
| Route | Advertised/Approved route |
| AccessGrant | ACL gerada |
| EnrollmentToken | PreAuthKey |

## Auth Keys

Regras:

- Chaves de bootstrap devem expirar.
- Evitar chaves reutilizaveis sem expiracao.
- Chaves para gateways fixos podem ser reutilizaveis durante a instalacao, mas
  devem ser revogadas depois de confirmado o enrolment.
- Nunca guardar o segredo completo em logs.

Fluxo:

```text
Admin -> Create Enrollment
Backend -> headscale preauthkeys create
Backend -> mostra token uma vez
Gateway -> tailscale up --login-server ... --authkey ...
Backend -> associa node criado ao gateway esperado
```

## Rotas

O gateway pode anunciar:

- Uma subnet de fabrica, por exemplo `192.168.10.0/24`.
- Um IP unico para um equipamento especifico, por exemplo `192.168.10.50/32`.

O manager deve detetar sobreposicoes entre clientes antes de aprovar rotas.

## ACLs

A politica ACL deve ser gerada a partir dos grants do produto.

Exemplo conceptual:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["rui@"],
      "dst": ["192.168.10.20:3389", "192.168.10.21:80"]
    }
  ]
}
```

Antes de escrever ACL no Headscale:

- Validar JSON.
- Preservar backup da politica anterior.
- Fazer dry-run se suportado.
- Registar auditoria.

## Operacoes Necessarias no Adapter

- `create_user(name)`
- `create_preauth_key(user, reusable, expiration, tags)`
- `list_nodes()`
- `expire_node(node_id)`
- `rename_node(node_id, name)`
- `list_routes()`
- `approve_route(node_id, route)`
- `disable_route(node_id, route)`
- `get_acl_policy()`
- `set_acl_policy(policy)`

O backend deve esconder a diferenca entre CLI e API atras de uma interface
propria.
