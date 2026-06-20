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
