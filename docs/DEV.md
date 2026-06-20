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

Em producao:

- `DEV_AUTH=false`
- `JWT_SECRET` igual ao do `dtek-webhub`
- `COOKIE_NAME=dtek_sso`
- `platform_key=remote_access`

## Limites Atuais

- Dados seed em memoria.
- Sem Postgres.
- Sem Headscale real.
- Sem CRUD persistente.
- Sem integracao no launcher do Hub.

## Proximos Passos

1. Registar `remote_access` no `dtek-webhub`.
2. Persistir clientes/sites/gateways/equipamentos em Postgres.
3. Trocar seed data por API CRUD.
4. Criar adapter Headscale: listar nodes, criar preauth key, aprovar rotas.
5. Criar wizard de enrolment do gateway.

