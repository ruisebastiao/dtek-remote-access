# Modelo de Dados e API

## Entidades Iniciais

### Customer

- `id`
- `name`
- `slug`
- `status`

### Site

- `id`
- `customer_id`
- `name`
- `location`
- `notes`

### GatewayDevice

- `id`
- `customer_id`
- `site_id`
- `name`
- `hostname`
- `status`
- `agent_version`
- `tailscale_version`
- `headscale_node_id`
- `last_seen_at`

### IndustrialDevice

- `id`
- `customer_id`
- `site_id`
- `gateway_id`
- `name`
- `kind`
- `ip_address`
- `ports`
- `notes`

`kind` exemplos:

- `hmi`
- `plc`
- `robot`
- `vision_pc`
- `industrial_pc`
- `camera`

### Route

- `id`
- `gateway_id`
- `cidr`
- `status`
- `headscale_route_id`
- `approved_at`

### EnrollmentToken

- `id`
- `gateway_id`
- `headscale_preauth_key_id`
- `expires_at`
- `used_at`
- `revoked_at`

O segredo do token deve ser mostrado apenas uma vez.

### AccessGrant

- `id`
- `user_id`
- `customer_id`
- `site_id`
- `industrial_device_id`
- `ports`
- `valid_from`
- `valid_until`
- `status`

### AuditEvent

- `id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `created_at`
- `metadata`

## API Inicial

```text
GET    /api/customers
POST   /api/customers
GET    /api/customers/{id}

GET    /api/sites?customer_id=
POST   /api/sites

GET    /api/gateways?site_id=
POST   /api/gateways
GET    /api/gateways/{id}
POST   /api/gateways/{id}/enrollment
POST   /api/gateways/{id}/approve-routes
POST   /api/gateways/{id}/revoke

GET    /api/devices?site_id=
POST   /api/devices

GET    /api/access-grants
POST   /api/access-grants
POST   /api/access-grants/{id}/revoke

GET    /api/headscale/nodes
GET    /api/headscale/routes

POST   /api/agent/heartbeat
POST   /api/agent/events
```

## Integracao com Hub

O backend deve validar o JWT/cookie emitido pelo `dtek-webhub`.

Claims esperadas:

- user id/email.
- role global.
- plataforma `vpn`.
- cliente(s) autorizados.

## Multi-tenant

Todos os objetos de produto devem ter `customer_id` direto ou indireto.

Listagens e detalhes devem filtrar por permissao de cliente/site. Root/admin
pode ver tudo; tecnico externo so deve ver o necessario para o seu grant.
