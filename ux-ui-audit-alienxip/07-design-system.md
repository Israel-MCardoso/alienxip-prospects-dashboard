# 07 - Design System

## Arquivos analisados

- `app-next/src/app/globals.css`
- `app-next/src/components/ui/*`
- `app-next/src/components/layout/os-shell.tsx`
- `app-next/src/features/workspace/workspace-home.tsx`
- `app-next/src/features/prospects/prospects-crm.tsx`
- `app-next/src/features/commercial/pipeline-board.tsx`
- `app-next/DESIGN_SYSTEM.md` existe no projeto e deve ser consultado em redesenho detalhado.

## Identidade geral

O sistema tem identidade escura/cyber operacional, com tema principal em preto, roxo e tons de slate. O design usa linguagem de centro de comando: `MOTHERXIP`, `MISSION CONTROL`, cards densos, uppercase, font mono e bordas sutis.

## Cores principais

### Light mode

Definidas em `globals.css`:

- Background: `#f8fafc`
- Foreground: `#0f172a`
- Card: `#ffffff`
- Primary: `#7B2EFF`
- Secondary/muted: `#f1f5f9`
- Border/input: `#e2e8f0`
- Sidebar: `#f1f5f9`

### Dark mode

Definidas em `.dark`:

- Background: `#030305`
- Foreground: `#f8fafc`
- Card: `#09090e`
- Primary: `#8b5cf6`
- Muted/secondary/accent: `#10101a`
- Border/input: `rgba(255,255,255,0.05)`
- Sidebar: `#06060a`

## Cores secundarias por dominio

- Comercial/prospects: rosa, purple, amber, blue, emerald.
- Tech: purple, red, orange, blue, emerald, cyan.
- Kanban: cada coluna tem borda superior colorida.
- Status/temperatura:
  - Hot: rose.
  - Warm: amber.
  - Cold: blue.
  - Fechado ganho: emerald.
  - Perdido: red.

## Gradientes

Usados principalmente em:

- Titulos com `bg-gradient-to-r`.
- Login com brilho roxo e fundo radial.
- Cards especiais com `from-purple-*`.
- Mission Control com textos em gradiente.

## Fontes

Definidas em `globals.css`:

- Sans: Geist fallback.
- Mono: Geist Mono fallback.
- Heading: Geist fallback.

Uso comum:

- Titulos e labels operacionais usam `font-mono`, uppercase e tracking alto.
- Texto de apoio usa tamanhos pequenos e `text-muted-foreground`.

## Tamanhos de fonte

Padroes recorrentes:

- Titulos principais: `text-3xl`.
- Titulos de cards: `text-sm`, `text-xs`.
- Badges e labels: `text-[10px]`, `text-[9px]`, uppercase.
- KPIs: `text-2xl`.

## Espacamentos

- Layout principal: `px-4 py-6`, `lg:px-6`.
- Cards e listas: `p-3`, `p-4`, `p-5`, `p-6`.
- Gaps frequentes: `gap-2`, `gap-3`, `gap-4`, `gap-6`.
- Sidebar: largura `w-64`, colapsada `w-16`.

## Bordas e radius

- Radius base: `--radius: 0.625rem`.
- Cards e drawers frequentemente usam `rounded-xl`, `rounded-2xl`.
- Botao e inputs usam `rounded-lg`.
- Badges usam radius alto (`rounded-4xl` no componente).

## Sombras

- Uso leve e difuso: `shadow-sm`, `shadow-md`, `shadow-2xl`.
- Glow roxo em login/drawers/cards: `shadow-purple-*`.
- Cards operacionais privilegiam borda e fundo translúcido mais do que sombra forte.

## Botoes

- Componente: `app-next/src/components/ui/button.tsx`.
- Variantes: default, secondary, outline, ghost etc.
- Estilo comum: altura compacta, `font-mono`, borda sutil, hover com roxo/muted.

## Cards

- Componente: `app-next/src/components/ui/card.tsx`.
- Estilo: fundo `bg-card`, borda `border-border`, textos pequenos.
- Alguns cards usam hardcoded dark colors (`bg-[#08080a]`, `bg-[#0a0a0c]`), com overrides em light mode.

## Tabelas

- Componente: `app-next/src/components/ui/table.tsx`.
- Usadas fortemente em Tech.
- Estilo denso, com badges em celulas e acoes na coluna direita.

## Formularios

- Inputs via componente `Input`.
- Muitos formularios ainda usam `<select>` nativo em Tech, Activity, Files, SDR e modal de outreach.
- Prospects usa `CustomSelect` e `CustomCheckbox` nas areas principais.

## Animacoes e transicoes

- `framer-motion` em sidebar, kanban e login.
- `animate-in`, `fade-in`, `slide-in-from-*`.
- Transicoes comuns: `duration-200`, `duration-300`, `duration-500`.
- Sidebar usa easing customizado `cubic-bezier(0.16,1,0.3,1)`.

## Light mode

Ha suporte em `globals.css` com variaveis e overrides para classes dark hardcoded. Mesmo assim, como muitos componentes usam classes manuais escuras, light mode depende de overrides CSS e pode ter inconsistencias.

## Problemas de design system encontrados

- Muitos estilos hardcoded por componente.
- Alguns textos aparecem com encoding quebrado em arquivos e possivelmente UI.
- Selects nativos ainda existem.
- Cards dentro de diferentes modulos seguem estilos parecidos, mas nem sempre partem de uma abstracao unica.
- Nao encontrado chart system formal.
