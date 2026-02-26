# ========== Estágio 1: Build ==========
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependência primeiro (melhor cache de camadas)
COPY package.json package-lock.json ./

# Instala dependências
RUN npm ci

# Copia o restante do código-fonte
COPY . .

# Compila a aplicação Angular em modo produção
RUN npm run build -- --configuration production

# ========== Estágio 2: Servidor Nginx ==========
FROM nginx:1.27-alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do estágio de build
# Angular 19 (application builder) gera em dist/<projeto>/browser/
COPY --from=build /app/dist/agro-solution/browser /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
