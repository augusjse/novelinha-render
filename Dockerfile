FROM node:22-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-noto-color-emoji ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY engine.js kit-noite.js audio.js voz.js server.js exemplo-ep01.json apagao-ep01.json ./
EXPOSE 3000
CMD ["node", "server.js"]
