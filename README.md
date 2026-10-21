# com600-practica8 — Pipeline CI/CD con GitHub Actions

Servicio **tareas-api** (API REST de tareas en memoria, heredado de la Práctica 7) automatizado con un pipeline de GitHub Actions que verifica, analiza, construye y publica la imagen en `ghcr.io`.

## Requisitos

- Node.js 20 o superior
- Docker 24+
- Git

## Uso local

```bash
npm ci
npm test              # suite completa (unitarias, API, contrato e integración con Testcontainers)
npm run test:cov      # suite con reporte de cobertura
npx eslint src test   # análisis estático
npm audit --audit-level=critical
docker build -t tareas:local .
docker run --rm -p 3000:3000 tareas:local
```

Probar el servicio:

```bash
curl -X POST http://localhost:3000/tareas -H "Content-Type: application/json" -d '{"titulo":"Estudiar k8s"}'
curl http://localhost:3000/tareas
```

## Estructura

```
.github/workflows/ci.yml   # el pipeline
src/                       # código del servicio
  app.js                   # rutas Express
  servidor.js              # punto de entrada (listen)
  tarea.js                 # lógica de estado de la tarea
  eventos.js               # constructor del evento TareaCreada
  repositorio.js           # repositorio MongoDB
test/                      # suite Jest (Práctica 7)
contratos/                 # contratos de eventos
Dockerfile
```

## Qué hace cada job del pipeline

| Job | Depende de | Qué hace |
|---|---|---|
| **pruebas** | — | Matrix Node 22 y 24: instala con `npm ci` (caché de npm activado), ejecuta la suite completa de la Práctica 7 y publica el reporte de cobertura como artefacto con 7 días de retención |
| **calidad** | — | `eslint src test --max-warnings 0` (análisis estático sin avisos) y `npm audit --audit-level=critical` (escaneo de dependencias). Corre en paralelo con **pruebas** |
| **imagen** | pruebas, calidad | Solo publica si las dos verificaciones pasaron. Inicia sesión en `ghcr.io` con el `GITHUB_TOKEN` efímero de la corrida (sin credenciales en el YAML) y construye/publish la imagen con etiquetas: `<sha>`, `1.0.0`, `tareas-api:1.0.0` y `tareas-api:latest` |

## Imagen publicada

```
ghcr.io/adamcho11/tareas-api:1.0.0
ghcr.io/adamcho11/tareas-api:latest
ghcr.io/adamcho11/com600-practica8:<sha>
ghcr.io/adamcho11/com600-practica8:1.0.0
```

La etiqueta `<sha>` permite rastrear la imagen hasta el commit exacto que la produjo.

```bash
docker pull ghcr.io/adamcho11/tareas-api:1.0.0
docker run --rm -p 3000:3000 ghcr.io/adamcho11/tareas-api:1.0.0
```

## Flujo de trabajo

1. Cada `push` y cada `pull_request` disparan el pipeline completo.
2. `pruebas` y `calidad` corren en paralelo.
3. `imagen` espera a que ambos estén en verde antes de publicar.
