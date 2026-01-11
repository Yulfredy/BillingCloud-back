FROM node:18-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Crear carpeta de subidas (la que usa tu multer)
RUN mkdir -p uploads

# Exponer el puerto (Code Engine usa el 8080 por defecto)
EXPOSE 8080

# Comando para arrancar
CMD ["node", "server.js"]