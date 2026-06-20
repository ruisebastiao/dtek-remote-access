const state = {
  view: "overview",
  me: null,
  overview: null,
  users: [],
  showArchived: false,
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
  const archiveToggle = document.getElementById("archiveToggleBtn");
  primary.textContent =
    state.view === "sites"
      ? "Novo site"
      : state.view === "devices"
        ? "Novo equipamento"
        : "Novo gateway";
  archiveToggle.textContent = state.showArchived ? "Ocultar arquivados" : "Mostrar arquivados";
  archiveToggle.hidden = !["sites", "gateways", "devices"].includes(state.view);
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
        <td>${badge(g.lifecycle_status)}</td>
        <td class="row-actions">
          <button class="mini" type="button" data-edit-gateway="${esc(g.id)}">Editar</button>
          <button class="mini" type="button" data-toggle-gateway="${esc(g.id)}" data-next="${g.lifecycle_status === "archived" ? "restore" : "archive"}">${g.lifecycle_status === "archived" ? "Restaurar" : "Arquivar"}</button>
        </td>
      </tr>`
    )
    .join("");
  return table(["Gateway", "Estado", "Tailnet IP", "Rotas LAN", "Ultimo heartbeat", "Ciclo", ""], rows);
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
        <td>${badge(site.lifecycle_status)}</td>
        <td class="row-actions">
          <button class="mini" type="button" data-edit-site="${esc(site.id)}">Editar</button>
          <button class="mini" type="button" data-toggle-site="${esc(site.id)}" data-next="${site.lifecycle_status === "archived" ? "restore" : "archive"}">${site.lifecycle_status === "archived" ? "Restaurar" : "Arquivar"}</button>
        </td>
      </tr>`
    )
    .join("");
  return `
    <section class="panel">
      <h2>Sites por cliente</h2>
      <p class="muted">Os clientes vem do Hub; os sites sao configurados aqui para organizar gateways e equipamentos.</p>
    </section>
    <div style="height: 16px"></div>
    ${table(["Site", "Cliente", "ID", "Ciclo", ""], rows)}
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
        <td>${badge(d.lifecycle_status)}</td>
        <td class="row-actions">
          <button class="mini" type="button" data-edit-device="${esc(d.id)}">Editar</button>
          <button class="mini" type="button" data-toggle-device="${esc(d.id)}" data-next="${d.lifecycle_status === "archived" ? "restore" : "archive"}">${d.lifecycle_status === "archived" ? "Restaurar" : "Arquivar"}</button>
        </td>
      </tr>`
    )
    .join("");
  return table(["Equipamento", "Endereco", "Protocolos", "Estado", "Gateway", "Ciclo", ""], rows);
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

function gatewaysForSite(siteId) {
  return state.overview.gateways.filter((gateway) => gateway.site_id === siteId);
}

function deviceIdFromName(name) {
  return `dev_${String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 52)}`;
}

function gatewayIdFromName(name) {
  return `gw_${String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 52)}`;
}

function optionList(items, emptyLabel, labelKey = "name", selectedId = "") {
  if (!items.length) return `<option value="">${esc(emptyLabel)}</option>`;
  return items
    .map((item) => `<option value="${esc(item.id)}" ${selectedId === item.id ? "selected" : ""}>${esc(item[labelKey])}</option>`)
    .join("");
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

function showSiteDialog(existing = null) {
  if (!state.overview) return;
  const customerOptions = state.overview.customers
    .map((customer) => `<option value="${esc(customer.id)}" ${existing?.customer_id === customer.id ? "selected" : ""}>${esc(customer.name)}</option>`)
    .join("");
  const isEdit = Boolean(existing);

  const dialog = document.createElement("div");
  dialog.className = "modal-backdrop";
  dialog.innerHTML = `
    <form class="modal modal--small" id="siteForm">
      <div class="modal__head">
        <div>
          <h2>${isEdit ? "Editar site" : "Novo site"}</h2>
          <p>${isEdit ? "Atualiza o site operacional." : "Cria um site operacional para um cliente vindo do Hub."}</p>
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
          <input id="siteName" required placeholder="Fabrica principal" value="${esc(existing?.name || "")}" />
        </label>
        <label>
          Localizacao
          <input id="siteLocation" placeholder="Linha 1 / Nave A / Cliente" value="${esc(existing?.location || "")}" />
        </label>
      </div>
      <p class="error" id="siteError"></p>
      <div class="modal__actions">
        <button class="ghost" type="button" data-close>Cancelar</button>
        <button class="primary" type="submit">${isEdit ? "Guardar site" : "Criar site"}</button>
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
      id: existing?.id || siteIdFromName(customerSelect.value, name),
      customer_id: customerSelect.value,
      name,
      location: dialog.querySelector("#siteLocation").value.trim(),
    };
    try {
      await api(isEdit ? `/sites/${existing.id}` : "/sites", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      close();
      state.view = "sites";
      await load();
    } catch (err) {
      error.textContent = err.message;
    }
  });
}

function showGatewayDialog(existing = null) {
  if (!state.overview) return;
  const firstCustomer =
    state.overview.customers.find((customer) => customer.id === existing?.customer_id) || state.overview.customers[0];
  const customerOptions = state.overview.customers
    .map((customer) => `<option value="${esc(customer.id)}" ${existing?.customer_id === customer.id ? "selected" : ""}>${esc(customer.name)}</option>`)
    .join("");
  const siteOptions = (firstCustomer?.sites || [])
    .map((site) => `<option value="${esc(site.id)}" ${existing?.site_id === site.id ? "selected" : ""}>${esc(site.name)}</option>`)
    .join("") || '<option value="">Sem sites criados</option>';
  const isEdit = Boolean(existing);

  const dialog = document.createElement("div");
  dialog.className = "modal-backdrop";
  dialog.innerHTML = `
    <form class="modal" id="gatewayForm">
      <div class="modal__head">
        <div>
          <h2>${isEdit ? "Editar gateway" : "Novo gateway"}</h2>
          <p>${isEdit ? "Atualiza o gateway industrial." : "Registo inicial do dispositivo que vai anunciar a rede industrial."}</p>
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
          <input id="gwName" required placeholder="GW-MAXIPLAS-02" value="${esc(existing?.name || "")}" />
        </label>
        <label>
          Tipo
          <input id="gwKind" placeholder="Raspberry Pi / Debian" value="${esc(existing?.kind || "")}" />
        </label>
        <label>
          Tailnet IP
          <input id="gwTailIp" placeholder="100.64.x.x" value="${esc(existing?.tailscale_ip || "")}" />
        </label>
        <label>
          Rotas LAN
          <input id="gwRoutes" placeholder="192.168.10.0/24, 192.168.11.0/24" value="${esc((existing?.lan_routes || []).join(", "))}" />
        </label>
      </div>
      <p class="error" id="gwError"></p>
      <div class="modal__actions">
        <button class="ghost" type="button" data-close>Cancelar</button>
        <button class="primary" type="submit">${isEdit ? "Guardar gateway" : "Criar gateway"}</button>
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
      id: existing?.id || gatewayIdFromName(name),
      customer_id: customerSelect.value,
      site_id: siteSelect.value,
      name,
      kind: dialog.querySelector("#gwKind").value.trim(),
      status: existing?.status || "offline",
      tailscale_ip: dialog.querySelector("#gwTailIp").value.trim(),
      lan_routes: routes,
      last_seen: "",
    };
    try {
      await api(isEdit ? `/gateways/${existing.id}` : "/gateways", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      close();
      state.view = "gateways";
      await load();
    } catch (err) {
      error.textContent = err.message;
    }
  });
}

function showDeviceDialog(existing = null) {
  if (!state.overview) return;
  const firstCustomer =
    state.overview.customers.find((customer) => customer.id === existing?.customer_id) || state.overview.customers[0];
  const firstSites = firstCustomer ? sitesForCustomer(firstCustomer.id) : [];
  const selectedSite = firstSites.find((site) => site.id === existing?.site_id) || firstSites[0];
  const firstGateways = selectedSite ? gatewaysForSite(selectedSite.id) : [];
  const customerOptions = state.overview.customers
    .map((customer) => `<option value="${esc(customer.id)}" ${existing?.customer_id === customer.id ? "selected" : ""}>${esc(customer.name)}</option>`)
    .join("");
  const isEdit = Boolean(existing);

  const dialog = document.createElement("div");
  dialog.className = "modal-backdrop";
  dialog.innerHTML = `
    <form class="modal" id="deviceForm">
      <div class="modal__head">
        <div>
          <h2>${isEdit ? "Editar equipamento" : "Novo equipamento"}</h2>
          <p>${isEdit ? "Atualiza o alvo industrial." : "Associa um HMI, PLC, robot, IPC ou outro alvo industrial a um gateway."}</p>
        </div>
        <button class="icon-btn" type="button" data-close>&times;</button>
      </div>
      <div class="form-grid">
        <label>
          Cliente
          <select id="devCustomer" required>${customerOptions}</select>
        </label>
        <label>
          Site
          <select id="devSite" required ${firstSites.length ? "" : "disabled"}>${optionList(firstSites, "Sem sites criados", "name", existing?.site_id)}</select>
        </label>
        <label>
          Gateway
          <select id="devGateway" required ${firstGateways.length ? "" : "disabled"}>${optionList(firstGateways, "Sem gateways criados", "name", existing?.gateway_id)}</select>
        </label>
        <label>
          Tipo
          <select id="devType">
            ${["HMI", "PLC", "Robot", "IPC", "Camera", "Other"].map((type) => `<option value="${type}" ${existing?.type === type ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </label>
        <label>
          Nome
          <input id="devName" required placeholder="MAXIPLAS_LONG_SIDE" value="${esc(existing?.name || "")}" />
        </label>
        <label>
          Endereco
          <input id="devAddress" required placeholder="192.168.10.21" value="${esc(existing?.address || "")}" />
        </label>
        <label class="form-grid__wide">
          Protocolos
          <div class="check-row">
            ${["http", "https", "rdp", "vnc", "ssh"].map((p) => `<label><input type="checkbox" class="devProtocol" value="${p}" ${(existing?.protocols || []).includes(p) ? "checked" : ""} /> ${p.toUpperCase()}</label>`).join("")}
          </div>
        </label>
      </div>
      <p class="error" id="devError"></p>
      <div class="modal__actions">
        <button class="ghost" type="button" data-close>Cancelar</button>
        <button class="primary" type="submit">${isEdit ? "Guardar equipamento" : "Criar equipamento"}</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);
  const customerSelect = dialog.querySelector("#devCustomer");
  const siteSelect = dialog.querySelector("#devSite");
  const gatewaySelect = dialog.querySelector("#devGateway");
  const nameInput = dialog.querySelector("#devName");
  const error = dialog.querySelector("#devError");

  function close() {
    dialog.remove();
  }

  function syncGateways() {
    const gateways = gatewaysForSite(siteSelect.value);
    gatewaySelect.disabled = gateways.length === 0;
    gatewaySelect.innerHTML = optionList(gateways, "Sem gateways criados", "name", existing?.gateway_id);
  }

  function syncSitesAndGateways() {
    const sites = sitesForCustomer(customerSelect.value);
    siteSelect.disabled = sites.length === 0;
    siteSelect.innerHTML = optionList(sites, "Sem sites criados", "name", existing?.site_id);
    syncGateways();
  }

  dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", close));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  customerSelect.addEventListener("change", syncSitesAndGateways);
  siteSelect.addEventListener("change", syncGateways);
  nameInput.focus();

  dialog.querySelector("#deviceForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    if (!siteSelect.value) {
      error.textContent = "Este cliente ainda nao tem sites no Remote Access.";
      return;
    }
    if (!gatewaySelect.value) {
      error.textContent = "Este site ainda nao tem gateways no Remote Access.";
      return;
    }
    const name = nameInput.value.trim();
    const protocols = [...dialog.querySelectorAll(".devProtocol:checked")].map((item) => item.value);
    const payload = {
      id: existing?.id || deviceIdFromName(name),
      customer_id: customerSelect.value,
      site_id: siteSelect.value,
      gateway_id: gatewaySelect.value,
      name,
      type: dialog.querySelector("#devType").value,
      address: dialog.querySelector("#devAddress").value.trim(),
      protocols,
      status: existing?.status || "unknown",
    };
    try {
      await api(isEdit ? `/devices/${existing.id}` : "/devices", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      close();
      state.view = "devices";
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
  wireEditButtons();
}

function wireEditButtons() {
  document.querySelectorAll("[data-edit-site]").forEach((button) => {
    button.addEventListener("click", () => {
      const siteId = button.dataset.editSite;
      const site = state.overview.customers.flatMap((customer) => customer.sites).find((item) => item.id === siteId);
      if (site) showSiteDialog(site);
    });
  });
  document.querySelectorAll("[data-edit-gateway]").forEach((button) => {
    button.addEventListener("click", () => {
      const gateway = state.overview.gateways.find((item) => item.id === button.dataset.editGateway);
      if (gateway) showGatewayDialog(gateway);
    });
  });
  document.querySelectorAll("[data-edit-device]").forEach((button) => {
    button.addEventListener("click", () => {
      const device = state.overview.devices.find((item) => item.id === button.dataset.editDevice);
      if (device) showDeviceDialog(device);
    });
  });
  document.querySelectorAll("[data-toggle-site]").forEach((button) => {
    button.addEventListener("click", () => toggleLifecycle("sites", button.dataset.toggleSite, button.dataset.next));
  });
  document.querySelectorAll("[data-toggle-gateway]").forEach((button) => {
    button.addEventListener("click", () => toggleLifecycle("gateways", button.dataset.toggleGateway, button.dataset.next));
  });
  document.querySelectorAll("[data-toggle-device]").forEach((button) => {
    button.addEventListener("click", () => toggleLifecycle("devices", button.dataset.toggleDevice, button.dataset.next));
  });
}

async function toggleLifecycle(resource, id, action) {
  await api(`/${resource}/${id}/${action}`, { method: "POST" });
  await load();
}

async function load() {
  const app = document.getElementById("app");
  try {
    app.innerHTML = '<div class="loading">A carregar...</div>';
    const [me, overview, usersResponse] = await Promise.all([
      api("/me"),
      api(`/overview${state.showArchived ? "?include_archived=true" : ""}`),
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
document.getElementById("archiveToggleBtn").addEventListener("click", async () => {
  state.showArchived = !state.showArchived;
  await load();
});
document.getElementById("primaryActionBtn").addEventListener("click", () => {
  if (state.view === "sites") showSiteDialog();
  else if (state.view === "devices") showDeviceDialog();
  else showGatewayDialog();
});

load();
