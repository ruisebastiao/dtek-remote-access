# Desenvolvimento Local

## Objetivo

O modo dev permite abrir a UI do `dtek-remote-access` sem depender ainda do Hub
real nem do Headscale. Isto acelera a validacao da experiencia.

## Arranque

```powershell
cd C:\Users\rui\Documents\projetos\dtek-remote-access\portal\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:DEV_AUTH="true"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8003 --reload
```

Abrir:

```text
http://127.0.0.1:8003/
```

## Autenticacao

Em dev:

- `DEV_AUTH=true`
- nao exige cookie do Hub
- injeta um utilizador root ficticio

## Teste Integrado com o Hub Local

Para validar o cookie/JWT real do Hub em dev, os dois servicos devem partilhar o
mesmo `JWT_SECRET`.

Hub local:

```powershell
cd C:\Users\rui\Documents\projetos\dtek-webhub\portal\backend
$env:DATABASE_URL="sqlite:///./hub_dev.db"
$env:JWT_SECRET="dev-secret"
$env:COOKIE_SECURE="false"
$env:COOKIE_DOMAIN=""
$env:REMOTE_ACCESS_URL="http://127.0.0.1:8003"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Remote Access local:

```powershell
cd C:\Users\rui\Documents\projetos\dtek-remote-access\portal\backend
$env:DEV_AUTH="true"
$env:JWT_SECRET="dev-secret"
$env:COOKIE_NAME="dtek_sso"
$env:HUB_URL="http://127.0.0.1:8000"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8003
```

Abrir o Hub:

```text
http://127.0.0.1:8000/
```

Depois de login no Hub, o tile `Remote Access` abre `http://127.0.0.1:8003/`.
Como ambos usam o host `127.0.0.1`, o cookie `dtek_sso` tambem e enviado para o
Remote Access.

Em producao:

- `DEV_AUTH=false`
- `JWT_SECRET` igual ao do `dtek-webhub`
- `COOKIE_NAME=dtek_sso`
- `platform_key=remote_access`

## Estado Atual

- SQLite dev persistente em `remote_access_dev.db`.
- CRUD inicial para customers, sites, gateways e devices.
- Integracao local com o launcher do Hub validada.
- Clientes vindos do Hub quando existe token real; o Remote Access guarda apenas
  a sombra local necessaria para associar sites/gateways/equipamentos.

## Limites Atuais

- Operacoes Headscale ainda em modo read-only.
- Criacao de enrolment keys, aprovacao de rotas e ACLs ainda nao estao expostas
  na UI.

## Proximos Passos

1. Criar wizard de enrolment do gateway.
2. Passar do adapter Headscale read-only para operacoes controladas.
3. Gerar preauth keys sem guardar segredos.
4. Aprovar rotas a partir da UI.
5. Criar ACLs por cliente/site/equipamento.

## Deploy

O repo inclui `docker-compose.yml` para ser consumido pelo `dtek-webplatform`.

Variaveis principais:

```text
REMOTE_ACCESS_PORT=8003
HEADSCALE_URL=https://vpn.dreamforit.com:4433
HEADSCALE_API_KEY=<api key gerada no Headscale>
```

`HEADSCALE_API_KEY` e segredo operacional e nao deve ser commitado.
