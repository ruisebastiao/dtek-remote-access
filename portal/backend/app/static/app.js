const state = {
  view: "overview",
  me: null,
  overview: null,
  users: [],
};

const titles = {
  overview: ["Overview", "Estado do acesso remoto industrial."],
  sites: ["Sites", "Sites industriais associados aos clientes do Hub."],
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

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (res.status === 204) return null;
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
  const primary = document.getElementById("primaryActionBtn");
  primary.textContent = state.view === "sites" ? "Novo site" : "Novo gateway";
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

function renderSites() {
  const rows = state.overview.customers
    .flatMap((customer) =>
      customer.sites.map((site) => ({
        ...site,
        customer_name: customer.name,
      }))
    )
    .map(
      (site) => `
      <tr>
        <td><strong>${esc(site.name)}</strong><br /><span class="muted">${esc(site.location)}</span></td>
        <td>${esc(site.customer_name)}</td>
        <td>${esc(site.id)}</td>
      </tr>`
    )
    .join("");
  return `
    <section class="panel">
      <h2>Sites por cliente</h2>
      <p class="muted">Os clientes vem do Hub; os sites sao configurados aqui para organizar gateways e equipamentos.</p>
    </section>
    <div style="height: 16px"></div>
    ${table(["Site", "Cliente", "ID"], rows)}
  `;
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

function sitesForCustomer(customerId) {
  const customer = state.overview.customers.find((item) => item.id === customerId);
  return customer ? customer.sites : [];
}

function gatewayIdFromName(name) {
  return `gw_${String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 52)}`;
}

function siteIdFromName(customerId, name) {
  return `site_${String(customerId || "")
    .replace(/^hub_client_/, "hub_")
    .replace(/[^a-z0-9_]+/g, "_")}_${String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)}`;
}

function showSiteDialog() {
  if (!state.overview) return;
  const customerOptions = state.overview.customers
    .map((customer) => `<option value="${esc(customer.id)}">${esc(customer.name)}</option>`)
    .join("");

  const dialog = document.createElement("div");
  dialog.className = "modal-backdrop";
  dialog.innerHTML = `
    <form class="modal modal--small" id="siteForm">
      <div class="modal__head">
        <div>
          <h2>Novo site</h2>
          <p>Cria um site operacional para um cliente vindo do Hub.</p>
        </div>
        <button class="icon-btn" type="button" data-close>&times;</button>
      </div>
      <div class="form-grid form-grid--single">
        <label>
          Cliente
          <select id="siteCustomer" required>${customerOptions}</select>
        </label>
        <label>
          Nome do site
          <input id="siteName" required placeholder="Fabrica principal" />
        </label>
        <label>
          Localizacao
          <input id="siteLocation" placeholder="Linha 1 / Nave A / Cliente" />
        </label>
      </div>
      <p class="error" id="siteError"></p>
      <div class="modal__actions">
        <button class="ghost" type="button" data-close>Cancelar</button>
        <button class="primary" type="submit">Criar site</button>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);
  const customerSelect = dialog.querySelector("#siteCustomer");
  const nameInput = dialog.querySelector("#siteName");
  const error = dialog.querySelector("#siteError");

  function close() {
    dialog.remove();
  }

  dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", close));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  nameInput.focus();

  dialog.querySelector("#siteForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    const name = nameInput.value.trim();
    const payload = {
      id: siteIdFromName(customerSelect.value, name),
      customer_id: customerSelect.value,
      name,
      location: dialog.querySelector("#siteLocation").value.trim(),
    };
    try {
      await api("/sites", { method: "POST", body: JSON.stringify(payload) });
      close();
      state.view = "sites";
      await load();
    } catch (err) {
      error.textContent = err.message;
    }
  });
}

function showGatewayDialog() {
  if (!state.overview) return;
  const firstCustomer = state.overview.customers[0];
  const customerOptions = state.overview.customers
    .map((customer) => `<option value="${esc(customer.id)}">${esc(customer.name)}</option>`)
    .join("");
  const siteOptions = (firstCustomer?.sites || [])
    .map((site) => `<option value="${esc(site.id)}">${esc(site.name)}</option>`)
    .join("") || '<option value="">Sem sites criados</option>';

  const dialog = document.createElement("div");
  dialog.className = "modal-backdrop";
  dialog.innerHTML = `
    <form class="modal" id="gatewayForm">
      <div class="modal__head">
        <div>
          <h2>Novo gateway</h2>
          <p>Registo inicial do dispositivo que vai anunciar a rede industrial.</p>
        </div>
        <button class="icon-btn" type="button" data-close>&times;</button>
      </div>
      <div class="form-grid">
        <label>
          Cliente
          <select id="gwCustomer" required>${customerOptions}</select>
        </label>
        <label>
          Site
          <select id="gwSite" required ${siteOptions.includes("Sem sites") ? "disabled" : ""}>${siteOptions}</select>
        </label>
        <label>
          Nome
          <input id="gwName" required placeholder="GW-MAXIPLAS-02" />
        </label>
        <label>
          Tipo
          <input id="gwKind" placeholder="Raspberry Pi / Debian" />
        </label>
        <label>
          Tailnet IP
          <input id="gwTailIp" placeholder="100.64.x.x" />
        </label>
        <label>
          Rotas LAN
          <input id="gwRoutes" placeholder="192.168.10.0/24, 192.168.11.0/24" />
        </label>
      </div>
      <p class="error" id="gwError"></p>
      <div class="modal__actions">
        <button class="ghost" type="button" data-close>Cancelar</button>
        <button class="primary" type="submit">Criar gateway</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);
  const customerSelect = dialog.querySelector("#gwCustomer");
  const siteSelect = dialog.querySelector("#gwSite");
  const nameInput = dialog.querySelector("#gwName");
  const error = dialog.querySelector("#gwError");

  function close() {
    dialog.remove();
  }

  function syncSites() {
    const sites = sitesForCustomer(customerSelect.value);
    siteSelect.disabled = sites.length === 0;
    siteSelect.innerHTML = sites.length
      ? sites.map((site) => `<option value="${esc(site.id)}">${esc(site.name)}</option>`).join("")
      : '<option value="">Sem sites criados</option>';
  }

  dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", close));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  customerSelect.addEventListener("change", syncSites);
  nameInput.focus();

  dialog.querySelector("#gatewayForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    if (!siteSelect.value) {
      error.textContent = "Este cliente ainda nao tem sites no Remote Access. Cria primeiro um site.";
      return;
    }
    const name = nameInput.value.trim();
    const routes = dialog
      .querySelector("#gwRoutes")
      .value.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const payload = {
      id: gatewayIdFromName(name),
      customer_id: customerSelect.value,
      site_id: siteSelect.value,
      name,
      kind: dialog.querySelector("#gwKind").value.trim(),
      status: "offline",
      tailscale_ip: dialog.querySelector("#gwTailIp").value.trim(),
      lan_routes: routes,
      last_seen: "",
    };
    try {
      await api("/gateways", { method: "POST", body: JSON.stringify(payload) });
      close();
      state.view = "gateways";
      await load();
    } catch (err) {
      error.textContent = err.message;
    }
  });
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
  else if (state.view === "sites") app.innerHTML = renderSites();
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
document.getElementById("primaryActionBtn").addEventListener("click", () => {
  if (state.view === "sites") showSiteDialog();
  else showGatewayDialog();
});

load();
