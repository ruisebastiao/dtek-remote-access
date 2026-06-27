WORKLOG

2026-06-20
- Initialize repository documentation for `dtek-remote-access`.
- Define the product scope: DreamForTek remote industrial access manager over
  Headscale/Tailscale, integrated with `dtek-webhub`.
- Add architecture, roadmap, Headscale integration, device agent, security,
  data/API and EasyAccess comparison documents.
- Align repository naming and Git remote with `dtek-remote-access`.
- Add initial FastAPI service with Hub-compatible JWT validation shape.
- Add dev-mode root auth, mock Remote Access data and first static management UI.
- Document local development flow on port 8003.
- Align Remote Access UI colors and controls with the existing Hub/Helpdesk
  dark theme.
- Document integrated local SSO test with `dtek-webhub` and shared JWT secret.
- Add SQLAlchemy persistence with SQLite dev DB, idempotent seed data and
  initial CRUD/read endpoints for customers, sites, gateways, devices and grants.
- Replace the "Novo gateway" placeholder with a real modal form that creates
  gateways through the API and refreshes the UI.
- Use `dtek-webhub` as the client source when a real Hub JWT is available,
  syncing only local customer shadows for Remote Access operational data.
- Add a Sites view and "Novo site" modal so Hub clients can receive local
  Remote Access sites before gateways are assigned.
- Add a "Novo equipamento" modal with customer/site/gateway cascade and
  protocol selection, creating industrial devices through the API.
- Add update endpoints and edit buttons/modals for sites, gateways and
  industrial devices.
- Add lifecycle archive/restore support for sites, gateways and devices, with a
  UI toggle to show archived inventory.
- Add optional read-only Headscale status integration and UI tab for future
  TowerV2 control plane monitoring.

2026-06-28
- Document the final identity/role split for Remote Access: users stay managed
  centrally in `dtek-webhub`, while Remote Access stores only VPN-specific
  grants/configuration; normal users are read/operation limited and only
  `admin`/`root` can change sensitive VPN configuration.
- Add production Dockerfile and `docker-compose.yml` so `dtek-webplatform` can
  deploy Remote Access as a Service Provider on port 8003.
- Extend the read-only Headscale adapter to expose real
  `approvedRoutes`/`availableRoutes`/`subnetRoutes` from Headscale v0.29.
- Document production deployment variables, including the non-versioned
  `HEADSCALE_API_KEY`.
- Remove local dummy/demo seed data from dev; customers now come from Hub when
  a real Hub token is present, and VPN state comes from Headscale.
