# ---------- Backend: Node.js + Express (M2/M3) ----------
FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# install dependency dulu agar layer ter-cache selama package*.json tidak berubah
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# jalankan sebagai user non-root
USER node
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:8000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
