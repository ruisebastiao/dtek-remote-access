# Agente de Dispositivo

## Objetivo

O agente transforma um Raspberry Pi, mini-PC industrial ou PC embebido num
gateway gerido pela DreamForTek.

Responsabilidades:

- Instalar/verificar Tailscale.
- Registar o dispositivo no Headscale.
- Reportar heartbeat ao `dtek-remote-access`.
- Reportar interfaces de rede e IPs locais.
- Reportar rotas anunciadas.
- Aplicar configuracao aprovada.
- Opcionalmente descobrir equipamentos industriais.

## Target Inicial

- Raspberry Pi OS / Debian.
- Ubuntu Server.
- Linux industrial amd64/arm64.

Windows gateway fica fora do MVP. Windows pode ser cliente tecnico ou
equipamento alvo, mas nao o primeiro gateway gerido.

## Bootstrap

O manager gera um pacote de instalacao:

```text
customer_id
site_id
gateway_id
manager_url
headscale_url
preauth_key
desired_hostname
advertise_routes
```

O script de instalacao:

1. Instala Tailscale se necessario.
2. Executa `tailscale up`.
3. Instala o agente como servico systemd.
4. Envia primeiro heartbeat.

Exemplo conceptual:

```bash
curl -fsSL https://remote-access.dreamforit.com/install/gw_xxx.sh | sudo bash
```

Para producao, evitar scripts opacos sem validacao. O instalador deve mostrar o
cliente/site/gateway antes de aplicar.

## Heartbeat

Dados sugeridos:

```json
{
  "gateway_id": "gw_123",
  "hostname": "maxiplas-gw-01",
  "agent_version": "0.1.0",
  "tailscale_version": "1.x",
  "tailscale_online": true,
  "headscale_node_id": "42",
  "interfaces": [
    {"name": "eth0", "ipv4": ["192.168.10.2/24"]}
  ],
  "advertised_routes": ["192.168.10.0/24"],
  "uptime_seconds": 12345
}
```

## Descoberta de Equipamentos

Fase futura. Possibilidades:

- Ping sweep limitado e explicito.
- ARP table.
- mDNS/LLMNR quando aplicavel.
- Scan de portas permitido por site.
- Importacao manual por CSV.

Em ambiente industrial, descoberta automatica deve ser conservadora para nao
perturbar PLCs/robots.

## Comandos Remotos

Evitar comando remoto generico no MVP. Comecar por operacoes seguras:

- Reaplicar configuracao Tailscale.
- Reanunciar rotas.
- Enviar diagnostico.
- Atualizar agente.

Qualquer comando remoto deve ter:

- Auditoria.
- Autorizacao explicita.
- Timeout.
- Output limitado e sem segredos.

## Atualizacoes

Fase inicial:

- Atualizacao manual por script versionado.

Fase posterior:

- Auto-update controlado pelo manager.
- Rollback.
- Canal stable/beta.
