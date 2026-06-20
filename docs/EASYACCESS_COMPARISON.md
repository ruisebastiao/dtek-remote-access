# Comparacao com EasyAccess

## Referencia Funcional

EasyAccess fornece uma experiencia simples para aceder remotamente a HMIs e
equipamentos industriais. A referencia util para nos e a experiencia de
produto:

- Lista de equipamentos/HMIs.
- Estado online/offline.
- Acesso remoto sem configurar VPN manual complexa.
- Gestao por conta/utilizador.

O objetivo do `dtek-remote-access` nao e copiar a implementacao EasyAccess, mas
ter capacidades equivalentes adaptadas ao ecossistema DreamForTek.

## Equivalencias

| EasyAccess | dtek-remote-access |
|---|---|
| HMI/dispositivo registado | GatewayDevice / IndustrialDevice |
| Estado online/offline | Heartbeat do agente + Headscale node status |
| Conta/utilizador | dtek-webhub user |
| Grupo/cliente | Customer/Site |
| Acesso remoto | Tailscale route + ACL grant |
| Lista de HMIs | Lista de equipamentos por site |

## Diferencas Propostas

- Acesso por VPN completa para ferramentas industriais nativas.
- Gestao multi-cliente integrada no Hub.
- ACLs por equipamento e porta.
- Gateways em Raspberry Pi/mini-PC, nao apenas HMI especifico.
- Possibilidade futura de WebSSH/noVNC/Guacamole.
- Auditoria e grants temporarios.

## MVP Inspirado no EasyAccess

Primeira pagina no Hub/manager:

```text
Remote Access
  Search equipment
  Sort by name/site/status

  Customer: Maxiplas
    Site: Linha 1
      Gateway: maxiplas-gw-01   Online
        MAXIPLAS_LONG_SIDE      Offline/Online
        MAXIPLAS_SHORT_SIDE     Offline/Online
```

Acoes por equipamento:

- Ver detalhes.
- Copiar IP/porta.
- Criar acesso temporario.
- Abrir Web HMI quando for HTTP/HTTPS.
- Instrucoes para ligar via Tailscale.

## Fases de Experiencia

### Fase 1

Listagem e estado. Acesso via VPN completa e ferramentas externas.

### Fase 2

Grants temporarios, ACLs e auditoria.

### Fase 3

Atalhos para RDP/SSH/Web HMI e geracao de comandos.

### Fase 4

Sessao no browser para protocolos selecionados.
