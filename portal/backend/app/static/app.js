const state = {
  view: "overview",
  me: null,
  overview: null,
  users: [],
};

const titles = {
  overview: ["Overview", "Estado do acesso remoto industrial."],
  gateways: ["Gateways", "Dispositivos instalados nos clientes."],
  devices: ["Equipamentos", "Alvos industriais acessiveis pela VPN."],
  users: ["Users & acesso", "Permissoes operacionais por utilizador do Hub."],
};

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

async function api(path) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function badge(value) {
  const v = String(value || "");
  const klass =
    ["online", "reachable", "active", "root", "admin"].includes(v)
      ? "good"
      : ["offline", "unknown"].includes(v)
        ? "warn"
        : "";
  return `<span class="badge ${klass}">${esc(v)}</span>`;
}

function chips(values) {
  return `<div class="chips">${(values || [])
    .map((x) => `<span class="badge">${esc(x)}</span>`)
    .join("")}</div>`;
}

function renderSession() {
  const box = document.getElementById("sessionBox");
  if (!state.me) {
    box.textContent = "Sem sessao";
    return;
  }
  box.innerHTML = `
    <strong>${esc(state.me.name)}</strong><br />
    ${esc(state.me.email)}<br />
    Hub: ${esc(state.me.hub_role)}<br />
    Remote: ${esc(state.me.remote_role || "-")}
    ${state.me.dev_auth ? "<br /><span>DEV_AUTH ativo</span>" : ""}
  `;
}

function setTitle() {
  const [title, subtitle] = titles[state.view];
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageSubtitle").textContent = subtitle;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
}

function renderStats(stats) {
  const labels = [
    ["customers", "Clientes"],
    ["sites", "Sites"],
    ["gateways_online", "Gateways online"],
    ["devices", "Equipamentos"],
    ["users", "Users"],
  ];
  return `<div class="stats">${labels
    .map(([key, label]) => `<div class="stat"><span>${label}</span><strong>${stats[key]}</strong></div>`)
    .join("")}</div>`;
}

function renderOverview() {
  const data = state.overview;
  return `
    ${renderStats(data.stats)}
    <div class="grid">
      <section class="panel">
        <h2>Clientes e sites</h2>
        <div class="list">
          ${data.customers
            .map(
              (customer) => `
              <div class="item">
                <div>
                  <strong>${esc(customer.name)}</strong>
                  <small>${customer.sites.map((s) => esc(s.name)).join(", ")}</small>
                </div>
                <span>${customer.sites.length} site(s)</span>
              </div>`
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        <h2>Eventos recentes</h2>
        <div class="list">
          ${data.recent_events
            .map(
              (event) => `
              <div class="item">
                <div>
                  <strong>${esc(event.message)}</strong>
                  <small>${esc(event.time)}</small>
                </div>
                ${badge(event.level)}
              </div>`
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderGateways() {
  const rows = state.overview.gateways
    .map(
      (g) => `
      <tr>
        <td><strong>${esc(g.name)}</strong><br /><span class="muted">${esc(g.kind)}</span></td>
        <td>${badge(g.status)}</td>
        <td>${esc(g.tailscale_ip)}</td>
        <td>${chips(g.lan_routes)}</td>
        <td>${esc(g.last_seen)}</td>
      </tr>`
    )
    .join("");
  return table(["Gateway", "Estado", "Tailnet IP", "Rotas LAN", "Ultimo heartbeat"], rows);
}

function renderDevices() {
  const rows = state.overview.devices
    .map(
      (d) => `
      <tr>
        <td><strong>${esc(d.name)}</strong><br /><span class="muted">${esc(d.type)}</span></td>
        <td>${esc(d.address)}</td>
        <td>${chips(d.protocols)}</td>
        <td>${badge(d.status)}</td>
        <td>${esc(d.gateway_id)}</td>
      </tr>`
    )
    .join("");
  return table(["Equipamento", "Endereco", "Protocolos", "Estado", "Gateway"], rows);
}

function renderUsers() {
  const rows = state.users
    .map(
      (u) => `
      <tr>
        <td><strong>${esc(u.name)}</strong><br /><span class="muted">${esc(u.email)}</span></td>
        <td>${esc(u.hub_role)}</td>
        <td>${badge(u.remote_role)}</td>
        <td>${chips(u.grants)}</td>
        <td>${badge(u.status)}</td>
      </tr>`
    )
    .join("");
  return `
    <section class="panel">
      <h2>Users importados do Hub</h2>
      <p class="muted">Identidade e login continuam no Hub. Aqui ficam as permissoes especificas de acesso remoto.</p>
    </section>
    <div style="height: 16px"></div>
    ${table(["Utilizador", "Role Hub", "Role Remote", "Grants", "Estado"], rows)}
  `;
}

function table(headers, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${headers.length}">Sem dados</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function render() {
  setTitle();
  renderSession();
  const app = document.getElementById("app");
  if (!state.overview) {
    app.innerHTML = '<div class="loading">A carregar...</div>';
    return;
  }
  if (state.view === "gateways") app.innerHTML = renderGateways();
  else if (state.view === "devices") app.innerHTML = renderDevices();
  else if (state.view === "users") app.innerHTML = renderUsers();
  else app.innerHTML = renderOverview();
}

async function load() {
  const app = document.getElementById("app");
  try {
    app.innerHTML = '<div class="loading">A carregar...</div>';
    const [me, overview, usersResponse] = await Promise.all([
      api("/me"),
      api("/overview"),
      api("/users").catch(() => ({ users: [] })),
    ]);
    state.me = me;
    state.overview = overview;
    state.users = usersResponse.users;
    render();
  } catch (err) {
    app.innerHTML = `<div class="error">${esc(err.message)}</div>`;
  }
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    render();
  });
});

document.getElementById("refreshBtn").addEventListener("click", load);
document.getElementById("enrollBtn").addEventListener("click", () => {
  alert("Proximo passo: wizard para gerar enrolment key Headscale e bootstrap do gateway.");
});

load();

