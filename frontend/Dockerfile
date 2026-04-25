# Usar una imagen base de Node.js
FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar el package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto que Vite usa por defecto
EXPOSE 5173

# Comando para iniciar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
