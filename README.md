# Projeto Covil do Calango

## Objetivo

Esse projeto é um sistema gerenciador web feito em Angular 19, para ser integrado pelos demais sistemas da Covil do Calango, uma loja Geek de board e card games, o principal foco é receber as infiormações dos clientes do alicativo e auxiliar no gerenciamento de comandas e pedidos, tendo em vista que a loja também trabalha com alimentação, servindo lanches e produtos para seus clientes.

Atualmente o sistema está sendo servido no [vercel](http://vercel.com/) e exposto por essa [url](https://covil-calango-web.vercel.app/dashboard)

## Executando com Docker

Para construir a imagem e iniciar a aplicação:

```bash
docker compose up --build
```

A aplicação ficará disponível em <http://localhost:8080>. Para executar em segundo plano, use `docker compose up --build -d`; para parar e remover o container, use `docker compose down`.

