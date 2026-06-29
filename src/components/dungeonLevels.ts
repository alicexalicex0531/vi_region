import type { DungeonLevel, MonsterPlacement } from './IsometricDungeonMap'
import {
  B1_GRASSLAND,
  B2_MINE,
  B3_LAKE,
  B4_VOLCANO,
  B5_PEAK,
} from './IsometricDungeonMap'
import { MONSTER_BY_ID, monsterCombatStats } from '../data/monsters'

// 立體地圖的擺位/造型/主題沿用元件內建的關卡 template；
// 怪物的「名字/菁英/重生/數值」一律由 game store 餵進來（純呈現升級，機制不變）
const TEMPLATES: Record<string, DungeonLevel> = {
  B1: B1_GRASSLAND,
  B2: B2_MINE,
  B3: B3_LAKE,
  B4: B4_VOLCANO,
  B5: B5_PEAK,
}

// 擺位 slot 索引 → store 怪物 id（對齊各 template.monsters 的順序）
// B1~B4 與 store 順序一致；B5 前三隻在元件 template 內順序不同，需精準重排（殘渣/風靈/雷鷲）
export const PLACEMENT_ORDER: Record<string, string[]> = {
  B1: ['jobless_slime', 'forgetful_fairy', 'hiccup_bunny', 'lost_chick'],
  B2: ['grumpy_golem', 'lying_mole', 'charcoal_goblin', 'golden_colossus'],
  B3: ['seasick_mermaid', 'ungrillable_eel', 'shiny_carp', 'narcissus_sprite'],
  B4: ['overworked_phoenix', 'hoarse_salamander', 'sore_dwarf', 'flame_golem'],
  B5: ['unlucky_residue', 'lost_wind_spirit', 'bgm_thunderbird', 'ranking_wyvern', 'knotted_god'],
}

export function monsterIdAt(floorId: string, index: number): string | undefined {
  return PLACEMENT_ORDER[floorId]?.[index]
}

type Pos = { col: number; row: number }

// 各層格子地圖（隨機重生選空格用）
export const FLOOR_GRID: Record<string, string[][]> = {
  B1: B1_GRASSLAND.grid,
  B2: B2_MINE.grid,
  B3: B3_LAKE.grid,
  B4: B4_VOLCANO.grid,
  B5: B5_PEAK.grid,
}

// 各怪物的 template 原始擺位（id → {col,row}），給 store 算佔位與「盡量不同於原位」
export const TEMPLATE_POS: Record<string, Pos> = {}
for (const [floorId, ids] of Object.entries(PLACEMENT_ORDER)) {
  const tmpl = TEMPLATES[floorId]
  ids.forEach((id, i) => {
    const p = tmpl.monsters[i]
    TEMPLATE_POS[id] = { col: p.col, row: p.row }
  })
}

// 從某層 grid 找出非樹籬(H)/熔岩(L)/未被活怪佔據的格子，隨機挑一個（盡量不同於原位）
// GDD §12.1 v0.7：復活時跳隨機空格
export function pickFreeCell(
  floorId: string,
  occupied: Set<string>,
  current?: Pos,
): Pos | null {
  const grid = FLOOR_GRID[floorId]
  if (!grid) return null
  const cands: Pos[] = []
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c]
      if (cell === 'H' || cell === 'L') continue
      if (occupied.has(`${c},${r}`)) continue
      cands.push({ col: c, row: r })
    }
  }
  if (cands.length === 0) return current ?? null
  // 盡量挑不同於原位的格
  const fresh = current ? cands.filter((p) => p.col !== current.col || p.row !== current.row) : cands
  const pool = fresh.length > 0 ? fresh : cands
  return pool[Math.floor(Math.random() * pool.length)]
}

// 用 store 的即時狀態組出要傳給 <IsometricDungeonMap /> 的 level
export function buildLevel(
  floorId: string,
  elites: Record<string, boolean>,
  positions: Record<string, Pos> = {},
): DungeonLevel {
  const template = TEMPLATES[floorId]
  const order = PLACEMENT_ORDER[floorId]
  const monsters: MonsterPlacement[] = template.monsters.map((p, i) => {
    const m = MONSTER_BY_ID[order[i]]
    if (!m) return p
    const isElite = !m.isBoss && elites[m.id] === true
    const combat = monsterCombatStats(m, isElite)
    const pos = positions[m.id] // 隨機重生覆寫位置；無則沿用 template
    return {
      ...p, // sprite/labelBelow/bossLabel 沿用 template
      col: pos ? pos.col : p.col,
      row: pos ? pos.row : p.row,
      name: m.name, // 名字以 store 為準（canonical，修掉 template 的別字）
      hp: combat.hp,
      exp: combat.exp,
      isElite,
      isBoss: m.isBoss ?? p.isBoss,
    }
  })
  return { ...template, monsters }
}
