<DocMicroLead />

# Despliegue en producción

Para producción usa `docker-compose.prod.yml`. Añade:

- **Caddy** como proxy inverso con TLS automático vía Let's Encrypt
- **Cabeceras de seguridad** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- PostgreSQL y Ollama **no están expuestos al host** — solo accesibles dentro de la red Docker
- Healthcheck de la app (`GET /api/health`) conectado a la política de reinicio de Docker

---

## Requisitos

1. Un servidor con Docker y Docker Compose
2. Un nombre de dominio apuntando a tu servidor (registro A)
3. Puertos **80** y **443** abiertos en tu firewall

---

## Paso a paso

### 1. Configurar `.env`

```bash
cp .env.example .env
```

Edita `.env` y rellena **todos** los valores `CHANGE_ME`:

```env
# PostgreSQL — usa valores aleatorios fuertes
POSTGRES_USER=rag
POSTGRES_PASSWORD=una_contraseña_aleatoria_fuerte
POSTGRES_DB=rag_db

# Caddy — tu dominio público
DOMAIN=rag.tudominio.com

# LLM — llama3.1:8b soporta tool calling
OLLAMA_LLM_MODEL=llama3.1:8b

# Embeddings — Google es gratuito, recomendado
GOOGLE_API_KEY=tu_google_api_key

# Admin API — protege los endpoints /api/admin/*
ADMIN_API_KEY=otro_secreto_aleatorio
```

### 2. Iniciar

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy obtendrá automáticamente un certificado TLS para tu dominio. El primer arranque tarda un par de minutos mientras Caddy negocia con Let's Encrypt y Ollama descarga sus modelos.

### 3. Verificar

```bash
# La app está activa y la base de datos es accesible
curl https://rag.tudominio.com/api/health
# → {"status":"ok","checks":{"db":true,"embedding":true},"ts":"..."}

# Estado de los contenedores
docker compose -f docker-compose.prod.yml ps
```

---

## Arquitectura en producción

```
Internet
   │  :443 / :80
   ▼
┌──────────┐
│  Caddy   │  TLS automático, gzip, cabeceras de seguridad
└──────────┘
   │  :3000 (solo interno)
   ▼
┌──────────┐   ┌──────────────┐   ┌────────┐
│   app    │──▶│  postgres    │   │ ollama │
└──────────┘   └──────────────┘   └────────┘
             Sin puertos al host   Sin puertos al host
```

---

## Logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f caddy
```

---

## Backup

```bash
# Volcado de la base de datos a un archivo local
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql
```

---

## Actualizar

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Las migraciones de Prisma se ejecutan automáticamente al arrancar.

---

## Usar una base de datos gestionada

Para usar un servicio PostgreSQL gestionado (Railway, Supabase, Neon) en lugar del contenedor Docker:

1. Elimina el servicio `postgres` de `docker-compose.prod.yml`
2. Establece `DATABASE_URL` en `.env` con la cadena de conexión proporcionada por tu servicio
3. El servicio `app` migrará y se conectará al arrancar

---

## Personalizar Caddy

Edita `Caddyfile` para añadir rate limiting, basic auth o una página de error personalizada:

```
{$DOMAIN} {
  reverse_proxy app:3000
  encode gzip

  # Ejemplo: basic auth en endpoints de admin
  # basicauth /api/admin/* {
  #   admin JDJhJDE0...
  # }
}
```

Tras editar, recarga Caddy sin reiniciar:

```bash
docker compose -f docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```
