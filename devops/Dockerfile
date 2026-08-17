# ==========================
# STAGE 1 - BUILD
# ==========================
FROM node:22-alpine AS build

WORKDIR /app

# Layer de dependências
COPY package.json ./

RUN npm install

# Layer do código
COPY . .

RUN npm run build


# ==========================
# STAGE 2 - PRODUÇÃO
# ==========================
FROM nginx:alpine

# Copia apenas o resultado compilado
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]