FROM node:22-alpine AS build

WORKDIR /app

ARG API_URL

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN API_URL="${API_URL}" node -e 'const fs = require("node:fs"); const file = "src/environments/environment.prod.ts"; const source = fs.readFileSync(file, "utf8"); const updated = source.replace(/url:\s*[^,]+/, "url: " + JSON.stringify(process.env.API_URL)); if (source === updated) throw new Error("Could not replace the production API URL"); fs.writeFileSync(file, updated);'
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/covil-calango-web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
