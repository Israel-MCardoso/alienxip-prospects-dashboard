# MOTHERSHIP Design System & Governance Guide

This document establishes the UI/UX visual governance, semantic patterns, and rules for the MOTHERSHIP interface. All new screens, views, dashboard cockpits, and components must strictly align with this specification to maintain a cohesive, premium SaaS platform aesthetic inspired by Raycast, Linear, and OpenAI.

---

## 1. Cores e Temas (Color System)

The system is fully reactive and semantic, adapting smoothly between Light and Dark modes. **Never hardcode hex values like `#08080a` or `#ffffff` in Tailwind classes.** Use semantic utility classes mapping to CSS custom properties.

### CSS variables (`src/app/globals.css`)

| Token | Light Mode Value | Dark Mode Value | Target Usage |
| :--- | :--- | :--- | :--- |
| `bg-background` | `#f8fafc` | `#030305` | Master screen background |
| `bg-card` | `#ffffff` | `#09090e` | Modules, tiles, primary dashboard containers |
| `text-foreground`| `#0f172a` | `#f8fafc` | High contrast primary text labels |
| `text-muted-foreground` | `#64748b` | `#94a3b8` | Subtitle captions, secondary information |
| `border-border` | `#e2e8f0` | `rgba(255,255,255,0.05)` | Card boundaries, dividers, grid borders |
| `bg-primary` | `#7B2EFF` | `#8b5cf6` | Action buttons, active badges, accent highlights |

---

## 2. Tipografia (Typography)

We utilize unified sans-serif fonts for interfaces and monospaced fonts for numerical data to emphasize operational accuracy.

### Font Families
- **Sans-serif**: `Geist` (Inter fallback) — Used for descriptive texts, labels, inputs, and primary interface structure.
- **Monospace**: `Geist Mono` — Used for KPI counts, timestamps, currencies, batch codes, and execution IDs.

### Font Hierarchy Scale
- **H1 Page Title**: `text-3xl font-extrabold tracking-tight font-mono uppercase`
- **Section Heading**: `text-xs font-semibold uppercase tracking-widest font-mono text-muted-foreground`
- **KPI Value**: `text-2xl font-bold font-mono tracking-tight text-foreground`
- **Table Headers**: `font-mono uppercase tracking-wider text-[10px]`
- **Body / Descriptive Text**: `text-xs or text-sm text-muted-foreground font-sans`

---

## 3. Espaçamentos (Spacing Grid)

Always follow a strictly proportional spacing system using modular multipliers to avoid layout misalignments.

```
4px   (gap-1)  - Micro-spacing for inside indicators and inline badge text
8px   (gap-2)  - Button spacing, small gap items inside grid lines
12px  (gap-3)  - Small fields form rows, filter blocks layout gap
16px  (gap-4)  - Standard card inner paddings (p-4), layout gaps
24px  (gap-6)  - Page components vertical grid dividers (gap-6)
32px  (gap-8)  - Executive section breaks, login borders
```

---

## 4. Border Radius (Cantos Arredondados)

Cantos arredondados should be mathematically aligned. We enforce standard values derived from the root `--radius` variable.

- **KPI/Cards & Main Grid Modules**: Use `rounded-lg` (`0.625rem`) to create clean structural boxes.
- **Action Buttons & Form Controls**: Use `rounded-md` (`0.5rem`) for compact operational items.
- **Micro Badges / Tooltips / Small Elements**: Use `rounded-sm` or `rounded` (`0.3rem`) for tag labels.
- **Toggle Pills / Avatars**: Use `rounded-xl` or `rounded-full` (`9999px`) where circular flow is required.

---

## 5. Componentes e Controles (UI Elements)

### Cards (Cartões Operacionais)
Cards represent content boundaries. Avoid Radial overlays or neon gradient borders. Keep layouts flat, solid, and premium:
```tsx
<Card className="bg-card/45 border-border/60 hover:border-primary/25 hover:bg-card/65 transition-all duration-200 shadow-sm">
  <CardContent className="p-4 flex flex-col justify-between">
     ...
  </CardContent>
</Card>
```

### Formulários & Custom Selects (Form Controls)
- Standard browser select boxes are **prohibited**. Always import and use `<CustomSelect />`:
  ```tsx
  import { CustomSelect } from "@/components/ui/custom-select";
  ```
- **Inputs**: Text fields must use consistent heights (`h-8` or `h-9` for compact controls) and adapt borders smoothly.

### Tabelas (Data Tables)
Always layout data tabular forms using mono headers and clean horizontal borders:
- Head: `<thead className="bg-muted/50 font-mono uppercase tracking-wider text-[10px] border-b border-border">`
- Rows: `<tr className="hover:bg-muted/40 transition-all">`
- Cells padding: `px-4 py-3.5` for desktop, stacking columns on mobile.

---

## 6. Padrões Mobile (Mobile Excellence Guidelines)

Interfaces must be responsive, touch-friendly, and completely free of horizontal scroll overflows:

1. **Touch Targets (Minimum 44px)**:
   - Close triggers, menu navigation buttons, and link cards inside the mobile drawer must use `h-11` or `h-12` heights to allow quick touch accuracy without misclicks.
2. **Form Layout Stacking**:
   - Filter layouts configured as a grid on desktop (`grid-cols-4`, etc.) must stack naturally (`grid-cols-1`) on mobile displays to prevent fields from truncating.
3. **Empty States**:
   - Do not display decorative illustrations. Use clean, minimalist icons (`lucide-react`) centered, followed by a bold mono header, clear descriptive text, and a focused call-to-action button.
4. **Dev Drawer Overlays**:
   - Heavy log audits, developer information, and batch logs must not clutter the dashboard viewport. They reside inside responsive slide-out drawer sheets.
