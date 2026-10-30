# Projeto Covil do Calango

## Objetivo

Esse projeto é um sistema gerenciador web feito em Angular 19, para ser integrado pelos demais sistemas da Covil do Calango, uma loja Geek de board e card games, o principal foco é receber as infiormações dos clientes do alicativo e auxiliar no gerenciamento de comandas e pedidos, tendo em vista que a loja também trabalha com alimentação, servindo lanches e produtos para seus clientes.

Atualmente o sistema está sendo servido no [vercel](http://vercel.com/) e exposto por essa [url](https://covil-calango-web.vercel.app/dashboard)

## Executando com Docker

Configure `API_URL` (URL base da API) e `WEB_PORT` (porta local do WEB) em um arquivo `.env` na pasta do projeto:

Exemplo de `.env`:

```env
API_URL=https://api.exemplo.com
WEB_PORT=8080
```

Construa a imagem e inicie a aplicação:

```bash
docker compose up -d --build
```

A aplicação ficará disponível em <http://localhost:8080>. Para parar e remover o container, use `docker compose down`.
