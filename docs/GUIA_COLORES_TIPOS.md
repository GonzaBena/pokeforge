# 🎨 Guía de Variables CSS para Tipos Pokémon (PokeForge)

Esta guía documenta las variables CSS oficiales de los **18 tipos elementales** disponibles en PokeForge. Están declaradas globalmente en [`src/styles/tokens.css`](file:///Users/gonzo/Documents/workspace/poketeam/src/styles/tokens.css) bajo `:root`, listas para usar en cualquier componente, vista o artículo de blog.

---

## 📋 Tabla de Referencia de Tipos

| Tipo (ES) | Type (EN) | Variable CSS | Código Hex | Color |
| :--- | :--- | :--- | :--- | :--- |
| **Normal** | `normal` | `var(--type-normal)` | `#A8A878` | `#A8A878` |
| **Lucha** | `fighting` | `var(--type-fighting)` | `#C03028` | `#C03028` |
| **Volador** | `flying` | `var(--type-flying)` | `#A890F0` | `#A890F0` |
| **Veneno** | `poison` | `var(--type-poison)` | `#A040A0` | `#A040A0` |
| **Tierra** | `ground` | `var(--type-ground)` | `#E0C068` | `#E0C068` |
| **Roca** | `rock` | `var(--type-rock)` | `#B8A038` | `#B8A038` |
| **Bicho** | `bug` | `var(--type-bug)` | `#A8B820` | `#A8B820` |
| **Fantasma** | `ghost` | `var(--type-ghost)` | `#705898` | `#705898` |
| **Acero** | `steel` | `var(--type-steel)` | `#B8B8D0` | `#B8B8D0` |
| **Fuego** | `fire` | `var(--type-fire)` | `#F08030` | `#F08030` |
| **Agua** | `water` | `var(--type-water)` | `#6890F0` | `#6890F0` |
| **Planta** | `grass` | `var(--type-grass)` | `#78C850` | `#78C850` |
| **Eléctrico** | `electric` | `var(--type-electric)` | `#F8D030` | `#F8D030` |
| **Psíquico** | `psychic` | `var(--type-psychic)` | `#F85888` | `#F85888` |
| **Hielo** | `ice` | `var(--type-ice)` | `#98D8D8` | `#98D8D8` |
| **Dragón** | `dragon` | `var(--type-dragon)` | `#7038F8` | `#7038F8` |
| **Siniestro** | `dark` | `var(--type-dark)` | `#705848` | `#705848` |
| **Hada** | `fairy` | `var(--type-fairy)` | `#EE99AC` | `#EE99AC` |

---

## 🛠️ Modos de Uso

### 1. En Reglas CSS / Estilos
Puedes usar directamente `var(--type-*)` en cualquier propiedad CSS:

```css
/* Color de borde o acento */
.card-fuego {
  border-top: 3px solid var(--type-fire);
}

/* Efecto glow / resplandor suave con color-mix */
.card-fuego::before {
  background: radial-gradient(
    ellipse at top,
    var(--type-fire) 0%,
    transparent 70%
  );
}
```

---

### 2. Badges de Tipo (`.type-badge`)
¡No necesitas escribir colores en hexadecimal ni variables a mano! El componente `.type-badge` detecta el tipo automáticamente mediante el atributo `data-type` tanto en **español** como en **inglés**:

```html
<!-- En español -->
<span class="type-badge" data-type="planta">Planta</span>
<span class="type-badge" data-type="veneno">Veneno</span>
<span class="type-badge" data-type="fuego">Fuego</span>
<span class="type-badge" data-type="agua">Agua</span>

<!-- O en inglés -->
<span class="type-badge" data-type="grass">Planta</span>
<span class="type-badge" data-type="fire">Fuego</span>
<span class="type-badge" data-type="water">Agua</span>
```

---

### 3. Tarjetas Comparativas de Iniciales (`.starter-card`)
Al igual que los badges, `.starter-card` aplica automáticamente el color del acento, el borde superior y el resplandor de fondo usando `data-type`:

```html
<!-- Aplica automáticamente el color y resplandor verde de Planta -->
<div class="starter-card" data-type="planta">
  ...
</div>

<!-- Aplica automáticamente el color y resplandor naranja de Fuego -->
<div class="starter-card" data-type="fuego">
  ...
</div>

<!-- Aplica automáticamente el color y resplandor azul de Agua -->
<div class="starter-card" data-type="agua">
  ...
</div>
```

---

### 4. En JavaScript / TypeScript
Si necesitas los colores directamente en scripts (como en modales dinámicos o canvas), utiliza la función [`typeColor`](file:///Users/gonzo/Documents/workspace/poketeam/src/lib/typeColors.ts):

```ts
import { typeColor } from "../lib/typeColors";

const colorFuego = typeColor("fire"); // "#F08030"
```
