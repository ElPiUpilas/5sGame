# Ejercicio 5S — web app

Una recreación interactiva del ejercicio clásico de capacitación en 5S
(Lean/Kaizen). En vez de solo mirar el video, cada participante abre el link
en su celular o laptop y **vive en carne propia** cómo cada "S" mejora el
entorno de trabajo.

## Cómo funciona

5 rondas de **20 segundos** cada una. En cada ronda debes hacer clic en los
números del **1 al 49 en orden**, lo más rápido posible. El objetivo es
llegar al número más alto.

| Ronda | S japonesa | Qué pasa en el "taller" |
|-------|------------|-------------------------|
| 1. Caos | — | Números 1–90 revueltos, rotados, sucios |
| 2. Sort | Seiri | Desaparecen los números 50–90 |
| 3. Set in Order | Seiton | Aparece una grilla 3×3 |
| 4. Shine | Seiso | Se limpia la suciedad y los tiles opacos |
| 5. Standardize | Seiketsu | Cuadrícula 5×10 con números en orden |

Al final, una pantalla de **Sustain (Shitsuke)** muestra el progreso por ronda.

## Cómo correr localmente

No requiere build ni dependencias.

```bash
# Opción A: abrir directamente
open index.html

# Opción B: servidor estático (recomendado para probar en móvil desde LAN)
python3 -m http.server 8000
# luego visita http://localhost:8000
```

## Cómo desplegar

Esta app es **100 % estática**. Subes el repo tal cual a cualquier hosting
estático:

- **GitHub Pages**: Settings → Pages → Branch: `main` → `/ (root)` → Save
- **Netlify / Vercel / Cloudflare Pages**: conecta el repo sin build command
  (publish directory = `/`)
- **S3 / nginx / Apache**: sirve los archivos como cualquier sitio estático

No hay variables de entorno, ni backend, ni build step.

## Stack

- HTML + CSS + JavaScript (ES modules) — sin frameworks
- Sin dependencias externas ni CDNs
- Compatible con Chrome / Safari / Firefox / Edge modernos, iOS y Android

## Estructura

```
index.html          # Shell con las 5 pantallas
css/
  base.css          # Layout, tipografía, botones
  rounds.css        # Estilos del board y progresión visual
js/
  main.js           # Entry point, cablea eventos
  state.js          # Estado global + configuración de rondas
  rng.js            # PRNG con seed (mulberry32)
  layout.js         # Posicionamiento de tiles y generación de manchas
  screens.js        # Navegación entre pantallas
  round.js          # Loop de juego: timer + clicks + HUD
```

## Créditos

Ejercicio inspirado en el video clásico de 5S
(https://www.youtube.com/watch?v=VNTH_fvxj_c).
