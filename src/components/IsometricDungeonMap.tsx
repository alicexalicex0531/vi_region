import * as React from "react";
import { GrandmaSprite } from "./PhantomGrandma";

/**
 * IsometricDungeonMap — 《背包又滿了》關卡立體地圖
 * ----------------------------------------------------------------------------
 * 給 Claude Code 的接線說明 (Integration notes):
 *  - 純 React + inline SVG，零外部相依套件，可直接丟進現有 Vite 專案。
 *  - 整張圖完全由一個 `DungeonLevel` 物件驅動：迷宮排版 + 怪物位置 + 配色主題。
 *  - grid: string[][]，用 'P' / '.' / 'H' 描述格子：
 *        'P' = 可站怪物的草地, '.' = 一般草地通道, 'H' = 樹籬牆 (迷宮牆)。
 *        索引方式為 grid[row][col]；在等角空間裡 row 往「右下」、col 往「左下」延伸。
 *  - 怪物用 { col, row } 對應到某個格子，sprite 決定造型。
 *  - 不同樓層 (B1 草原 / B2 火山 / ...) 只要換 theme 顏色就能改皮，不必動程式。
 *  - 想接真實遊戲資料：把你 store 裡的怪物清單 map 成 MonsterPlacement[]，
 *        再組成 DungeonLevel 傳給 <IsometricDungeonMap level={...} /> 即可。
 *  - 已尊重 prefers-reduced-motion；使用者關閉動態時怪物就不彈跳。
 *
 * 使用範例:
 *   import IsometricDungeonMap, { B1_GRASSLAND } from "./IsometricDungeonMap";
 *   <IsometricDungeonMap level={B1_GRASSLAND} />
 * ----------------------------------------------------------------------------
 */

export type MonsterSprite =
  | "slime"
  | "sprite"
  | "rabbit"
  | "chick"
  | "phoenix"
  | "salamander"
  | "dwarf"
  | "golem"
  | "windspirit"
  | "eagle"
  | "residue"
  | "wyvern"
  | "destroyer"
  | "mermaid"
  | "eel"
  | "koi"
  | "narcissus"
  | "doll"
  | "mole"
  | "goblin"
  | "goldgolem";

export interface MonsterPlacement {
  col: number;
  row: number;
  name: string;
  sprite: MonsterSprite;
  hp?: number;
  exp?: number;
  /** 名牌放在怪物下方 (預設放上方)。靠近地圖底部的角落建議設 true。 */
  labelBelow?: boolean;
  /** 本次是否為菁英 (由遊戲邏輯決定，每張地圖最多一支)。true 時疊上菁英特效層。 */
  isElite?: boolean;
  /** 是否為頭目 (長條框那種)。true 時加金色氣場、王冠、頭目標籤、金色名牌 (不放大)。 */
  isBoss?: boolean;
  /** 頭目標籤文字，預設「小boss」；最終頭目可填「魔王」。 */
  bossLabel?: string;
}

export interface DungeonTheme {
  tileTopA: string;
  tileTopB: string;
  tileTopStroke: string;
  tileLeft: string;
  tileRight: string;
  hedgeBase: string;
  hedgeMid: string;
  hedgeLight: string;
  bannerText: string;
  bannerStroke: string;
  /** 'L' 熔岩格的顏色 (火山樓層用，其他樓層可不填)。 */
  lavaTop?: string;
  lavaHot?: string;
}

export interface DungeonLevel {
  id: string;
  label: string;
  grid: string[][];
  monsters: MonsterPlacement[];
  /** 可只覆寫部分顏色，其餘沿用草原預設主題。 */
  theme?: Partial<DungeonTheme>;
}

const TW = 72;
const TH = 36;
const DEPTH = 14;
const OX = 340;
const OY = 130;

const GRASS_THEME: DungeonTheme = {
  tileTopA: "#95CB5E",
  tileTopB: "#8BC150",
  tileTopStroke: "#6FA83F",
  tileLeft: "#5C9636",
  tileRight: "#74AF42",
  hedgeBase: "#4C9438",
  hedgeMid: "#56A03E",
  hedgeLight: "#5CA742",
  bannerText: "#2F6B22",
  bannerStroke: "#6FA83F",
};

const PILL: Record<MonsterSprite, { border: string; text: string }> = {
  slime: { border: "#D9842A", text: "#9A5A12" },
  sprite: { border: "#4E9A30", text: "#2E6614" },
  rabbit: { border: "#B0A4E4", text: "#5B4A8E" },
  chick: { border: "#E2B62C", text: "#9A7510" },
  phoenix: { border: "#C8431A", text: "#8A2A0E" },
  salamander: { border: "#3E8A2E", text: "#245018" },
  dwarf: { border: "#B07840", text: "#6E3018" },
  golem: { border: "#C8662A", text: "#7A3A12" },
  windspirit: { border: "#7FBFC9", text: "#2E5560" },
  eagle: { border: "#5E627A", text: "#3A3D52" },
  residue: { border: "#73726C", text: "#3A3A38" },
  wyvern: { border: "#2E7A2A", text: "#1E4A14" },
  destroyer: { border: "#6D28D9", text: "#4A1E8E" },
  mermaid: { border: "#2E8A80", text: "#1E5A52" },
  eel: { border: "#E0B020", text: "#8A6810" },
  koi: { border: "#D9921E", text: "#8A5A10" },
  narcissus: { border: "#3E8A78", text: "#2A5A50" },
  doll: { border: "#8A84A6", text: "#4A4568" },
  mole: { border: "#C88078", text: "#8A4A44" },
  goblin: { border: "#A83A18", text: "#7A2A10" },
  goldgolem: { border: "#B88A1E", text: "#7A5A10" },
};

const DURATIONS = [1.05, 1.32, 0.92, 1.18];
const DELAYS = [0, 0.22, 0.12, 0.4];

/** 菁英星芒的相對位置與延遲，與造型無關，任何怪都共用。 */
const ELITE_SPARKS = [
  { x: -19, y: -26, d: 0 },
  { x: 18, y: -40, d: 0.55 },
  { x: -2, y: -54, d: 1.1 },
];

function iso(c: number, r: number) {
  return { x: OX + (c - r) * (TW / 2), y: OY + (c + r) * (TH / 2) };
}

function Sprite({ kind }: { kind: MonsterSprite }) {
  switch (kind) {
    case "slime":
      return (
        <>
          <path d="M-22,0 C-25,-20 -16,-30 0,-30 C16,-30 25,-20 22,0 Z" fill="#F4A63F" stroke="#D9842A" strokeWidth={2} strokeLinejoin="round" />
          <ellipse cx={-9} cy={-30} rx={4} ry={2.5} fill="#ffffff" opacity={0.45} />
          <ellipse cx={-8} cy={-15} rx={3} ry={4} fill="#4A3115" />
          <ellipse cx={8} cy={-15} rx={3} ry={4} fill="#4A3115" />
          <path d="M-6,-6 Q0,-9 6,-6" stroke="#4A3115" strokeWidth={2} fill="none" strokeLinecap="round" />
        </>
      );
    case "sprite":
      return (
        <>
          <ellipse cx={-15} cy={-30} rx={8} ry={13} fill="#C7E6A8" opacity={0.78} stroke="#A9D487" strokeWidth={1} transform="rotate(-22 -15 -30)" />
          <ellipse cx={15} cy={-30} rx={8} ry={13} fill="#C7E6A8" opacity={0.78} stroke="#A9D487" strokeWidth={1} transform="rotate(22 15 -30)" />
          <ellipse cx={0} cy={-20} rx={12} ry={17} fill="#6FBF4A" stroke="#4E9A30" strokeWidth={2} />
          <line x1={0} y1={-37} x2={0} y2={-32} stroke="#4E9A30" strokeWidth={1.5} />
          <circle cx={0} cy={-40} r={3.2} fill="#FBE56B" stroke="#E0C84A" strokeWidth={1} />
          <circle cx={-5} cy={-24} r={2.5} fill="#234d12" />
          <circle cx={5} cy={-24} r={2.5} fill="#234d12" />
          <circle cx={0} cy={-14} r={3} fill="none" stroke="#234d12" strokeWidth={1.6} />
        </>
      );
    case "rabbit":
      return (
        <>
          <ellipse cx={-7} cy={-46} rx={5} ry={15} fill="#D5CCF2" stroke="#B0A4E4" strokeWidth={2} />
          <ellipse cx={7} cy={-46} rx={5} ry={15} fill="#D5CCF2" stroke="#B0A4E4" strokeWidth={2} />
          <ellipse cx={-7} cy={-46} rx={2} ry={9} fill="#EFC9DD" />
          <ellipse cx={7} cy={-46} rx={2} ry={9} fill="#EFC9DD" />
          <ellipse cx={0} cy={-17} rx={16} ry={19} fill="#E0D8F7" stroke="#B6ABE8" strokeWidth={2} />
          <ellipse cx={-10} cy={-13} rx={3.5} ry={2.2} fill="#F4B9D2" opacity={0.7} />
          <ellipse cx={10} cy={-13} rx={3.5} ry={2.2} fill="#F4B9D2" opacity={0.7} />
          <circle cx={-6} cy={-21} r={2.6} fill="#3a2f5e" />
          <circle cx={6} cy={-21} r={2.6} fill="#3a2f5e" />
          <ellipse cx={0} cy={-12} rx={2.4} ry={3} fill="#9B5BC4" />
          <path d="M21,-24 q3.5,5 0,8 q-3.5,-3 0,-8 Z" fill="#8FC7EA" opacity={0.9} />
        </>
      );
    case "chick":
      return (
        <>
          <path d="M-1,-38 l-4,-7 l5,3 l3,-6 l1,9 Z" fill="#F2C13A" />
          <circle cx={0} cy={-19} r={17} fill="#FBD94E" stroke="#E2B62C" strokeWidth={2} />
          <path d="M-18,-19 q-9,3 -3,9 q5,1 5,-4 Z" fill="#F6CC44" stroke="#E2B62C" strokeWidth={1.4} />
          <path d="M15,-21 l12,2 l-12,4 Z" fill="#F2922A" stroke="#D97E1E" strokeWidth={1} />
          <circle cx={-4} cy={-24} r={2.6} fill="#4a3411" />
          <circle cx={6} cy={-24} r={2.6} fill="#4a3411" />
          <path d="M-27,-33 q5,-3 9,-1" stroke="#CFE7F4" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.85} />
          <path d="M-31,-27 q5,-2 9,0" stroke="#CFE7F4" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />
        </>
      );
    case "phoenix":
      return (
        <>
          <path d="M-3,-2 q-14,8 -20,18 q12,-3 18,-9 Z" fill="#F2922A" opacity={0.9} />
          <path d="M3,-2 q14,8 20,18 q-12,-3 -18,-9 Z" fill="#F2922A" opacity={0.9} />
          <path d="M0,-2 C-15,-6 -17,-27 0,-33 C17,-27 15,-6 0,-2 Z" fill="#F0612A" stroke="#C8431A" strokeWidth={2} strokeLinejoin="round" />
          <path d="M-13,-20 q-16,-3 -22,7 q15,3 22,-3 Z" fill="#F4882A" stroke="#C8431A" strokeWidth={1.2} />
          <path d="M13,-20 q16,-3 22,7 q-15,3 -22,-3 Z" fill="#F4882A" stroke="#C8431A" strokeWidth={1.2} />
          <path d="M-7,-31 Q-8,-44 -2,-39 Q0,-50 2,-39 Q8,-44 7,-31 Z" fill="#F7B23A" />
          <path d="M-3,-33 Q-2,-42 0,-37 Q2,-42 3,-33 Z" fill="#E8492A" />
          <path d="M-15,-22 l-9,2 l8,3 Z" fill="#F2C13A" />
          <circle cx={-9} cy={-24} r={2.4} fill="#3a1e0e" />
          <path d="M-13,-27 q3,-1 6,0" stroke="#7a3a1a" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <ellipse cx={-7} cy={-30} rx={3} ry={1.5} fill="#ffffff" opacity={0.4} />
        </>
      );
    case "salamander":
      return (
        <>
          <path d="M13,-8 q15,0 16,-13 q-7,1 -10,7 q-2,4 -6,6 Z" fill="#5FB04A" stroke="#3E8A2E" strokeWidth={1.5} />
          <ellipse cx={0} cy={-15} rx={14} ry={18} fill="#5FB04A" stroke="#3E8A2E" strokeWidth={2} />
          <ellipse cx={0} cy={-11} rx={8.5} ry={12} fill="#F4C24A" opacity={0.92} />
          <path d="M-3,-31 q3,-9 6,-2 q3,-7 5,1 Z" fill="#F2702A" />
          <ellipse cx={-5} cy={-22} rx={4} ry={4.5} fill="#ffffff" />
          <ellipse cx={5} cy={-22} rx={4} ry={4.5} fill="#ffffff" />
          <circle cx={-4.5} cy={-21} r={2} fill="#243a16" />
          <circle cx={5.5} cy={-21} r={2} fill="#243a16" />
          <ellipse cx={0} cy={-12} rx={2.6} ry={3} fill="#7a3a2a" />
          <path d="M-12,-2 q-4,4 -1,7" stroke="#3E8A2E" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M12,-2 q4,4 1,7" stroke="#3E8A2E" strokeWidth={3} fill="none" strokeLinecap="round" />
          <circle cx={-9} cy={-26} r={1.5} fill="#F2702A" />
          <circle cx={9} cy={-28} r={1.5} fill="#F2702A" />
        </>
      );
    case "dwarf":
      return (
        <>
          <path d="M-13,0 Q-15,-20 0,-22 Q15,-20 13,0 Z" fill="#9A4A2A" stroke="#6E3018" strokeWidth={2} />
          <path d="M-12,-12 Q-20,-6 -14,2" stroke="#9A4A2A" strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M13,-10 q8,2 6,10" stroke="#9A4A2A" strokeWidth={5} fill="none" strokeLinecap="round" />
          <circle cx={0} cy={-26} r={11} fill="#E0A06A" stroke="#B07840" strokeWidth={1.5} />
          <rect x={-11} y={-37} width={22} height={6} rx={3} fill="#4A3A36" />
          <path d="M-11,-34 Q0,-41 11,-34 Z" fill="#5A463C" stroke="#3A2E2A" strokeWidth={1} />
          <circle cx={-4} cy={-28} r={1.6} fill="#3a2418" />
          <circle cx={4} cy={-28} r={1.6} fill="#3a2418" />
          <path d="M-7,-31 q3,-1.5 5,0" stroke="#7a4a2a" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <path d="M-10,-24 Q0,-6 10,-24 Q6,-15 0,-13 Q-6,-15 -10,-24 Z" fill="#E8A23A" stroke="#C8821E" strokeWidth={1.2} />
        </>
      );
    case "golem":
      return (
        <>
          <path d="M-18,0 Q-22,-26 -14,-36 Q0,-42 14,-36 Q22,-26 18,0 Z" fill="#473731" stroke="#2A201C" strokeWidth={2} />
          <circle cx={-19} cy={-26} r={8} fill="#473731" stroke="#2A201C" strokeWidth={1.5} />
          <circle cx={19} cy={-26} r={8} fill="#473731" stroke="#2A201C" strokeWidth={1.5} />
          <circle cx={-19} cy={-26} r={3} fill="#F2702A" opacity={0.8} />
          <circle cx={19} cy={-26} r={3} fill="#F2702A" opacity={0.8} />
          <path d="M-6,-4 L-2,-16 L-8,-24" stroke="#F2702A" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M6,-6 L3,-18 L9,-26" stroke="#F2702A" strokeWidth={2} fill="none" strokeLinecap="round" />
          <rect x={-11} y={-52} width={22} height={18} rx={5} fill="#52403A" stroke="#2A201C" strokeWidth={1.5} />
          <ellipse cx={-5} cy={-44} rx={2.6} ry={2} fill="#FFCB4A" />
          <ellipse cx={5} cy={-44} rx={2.6} ry={2} fill="#FFCB4A" />
          <path d="M-5,-39 q5,3 10,-1" stroke="#FFCB4A" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <path d="M15,-50 l1.2,-3 l1.2,3 l3,1.2 l-3,1.2 l-1.2,3 l-1.2,-3 l-3,-1.2 Z" fill="#FFF4C2" />
        </>
      );
    case "windspirit":
      return (
        <>
          <path d="M14,-10 q12,2 10,12 q-6,-2 -8,-8 Z" fill="#CDEAEE" opacity={0.7} />
          <path d="M0,-2 C-15,-4 -18,-24 -2,-29 C3,-33 14,-29 15,-20 C21,-20 21,-10 13,-11 C11,-4 4,-3 0,-2 Z" fill="#C3E6EB" stroke="#7FBFC9" strokeWidth={2} strokeLinejoin="round" />
          <path d="M-3,-30 q2,-7 7,-4" stroke="#9FD3DA" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M-17,-20 q-8,-1 -9,5" stroke="#9FD3DA" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8} />
          <path d="M-19,-13 q-7,0 -8,5" stroke="#9FD3DA" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.6} />
          <circle cx={-3} cy={-19} r={2.2} fill="#2E5560" />
          <circle cx={6} cy={-19} r={2.2} fill="#2E5560" />
          <path d="M-1,-12 q3,1 5,0" stroke="#2E5560" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <ellipse cx={-5} cy={-26} rx={3} ry={1.6} fill="#ffffff" opacity={0.5} />
        </>
      );
    case "eagle":
      return (
        <>
          <path d="M-22,-18 q-16,4 -20,16 q14,0 22,-8 Z" fill="#8A8FA8" stroke="#5E627A" strokeWidth={1.2} />
          <path d="M22,-18 q16,4 20,16 q-14,0 -22,-8 Z" fill="#8A8FA8" stroke="#5E627A" strokeWidth={1.2} />
          <ellipse cx={0} cy={-16} rx={13} ry={17} fill="#9A9FB6" stroke="#5E627A" strokeWidth={2} />
          <ellipse cx={0} cy={-14} rx={7} ry={10} fill="#C8CBD8" opacity={0.7} />
          <circle cx={0} cy={-30} r={9} fill="#A6ABC0" stroke="#5E627A" strokeWidth={1.5} />
          <path d="M-2,-31 l-10,2 l9,3 Z" fill="#F2B23A" stroke="#D9921E" strokeWidth={1} />
          <circle cx={-4} cy={-31} r={2} fill="#2a2a33" />
          <path d="M-8,-34 q3,-2 6,0" stroke="#5E627A" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <path d="M20,-30 l5,-9 l-2,8 l6,-2 l-9,11 l2,-7 Z" fill="#FFD24A" stroke="#E0B020" strokeWidth={0.8} />
          <path d="M14,-42 l0,9" stroke="#7C5AC4" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <circle cx={12.6} cy={-33} r={2} fill="#7C5AC4" />
        </>
      );
    case "residue":
      return (
        <>
          <circle cx={-7} cy={-33} r={3} fill="#B6BAC2" opacity={0.6} />
          <circle cx={-2} cy={-34} r={3.5} fill="#B6BAC2" opacity={0.6} />
          <line x1={-6} y1={-29} x2={-7} y2={-26} stroke="#8FA8C8" strokeWidth={1} opacity={0.7} />
          <path d="M-13,0 L-15,-16 L-6,-26 L7,-24 L14,-12 L11,0 Z" fill="#A8A6A0" stroke="#73726C" strokeWidth={2} strokeLinejoin="round" />
          <path d="M-6,-26 L-3,-12 L7,-24" stroke="#888780" strokeWidth={1} fill="none" />
          <path d="M-3,-12 L11,0" stroke="#888780" strokeWidth={1} fill="none" />
          <circle cx={-4} cy={-15} r={1.8} fill="#3a3a38" />
          <circle cx={4} cy={-15} r={1.8} fill="#3a3a38" />
          <path d="M-4,-7 q4,-3 8,0" stroke="#3a3a38" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </>
      );
    case "wyvern":
      return (
        <>
          <path d="M12,-8 q14,0 14,-14 q-7,2 -9,8 q-2,4 -5,6 Z" fill="#4FA64A" stroke="#2E7A2A" strokeWidth={1.5} />
          <path d="M-13,-16 q-12,-2 -16,8 q12,1 17,-3 Z" fill="#6FC05A" stroke="#2E7A2A" strokeWidth={1.2} />
          <path d="M13,-16 q12,-2 16,8 q-12,1 -17,-3 Z" fill="#6FC05A" stroke="#2E7A2A" strokeWidth={1.2} />
          <ellipse cx={0} cy={-16} rx={12} ry={17} fill="#4FA64A" stroke="#2E7A2A" strokeWidth={2} />
          <ellipse cx={0} cy={-13} rx={7} ry={10} fill="#CFE89F" opacity={0.85} />
          <path d="M0,-33 l-3,-6 l4,4 l2,-5 l1,7 Z" fill="#3E8A2E" />
          <ellipse cx={0} cy={-28} rx={9} ry={7} fill="#5BB652" stroke="#2E7A2A" strokeWidth={1.5} />
          <path d="M-7,-31 l-3,-5 l4,3 Z" fill="#CFE0A0" />
          <path d="M7,-31 l3,-5 l-4,3 Z" fill="#CFE0A0" />
          <path d="M-6,-28 q3,-2 5,-1" stroke="#1e3a14" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <path d="M2,-29 q3,-1 5,1" stroke="#1e3a14" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <path d="M-3,-23 q3,-1 6,0" stroke="#1e3a14" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </>
      );
    case "destroyer":
      return (
        <>
          <path d="M14,-6 q14,2 12,14 q-3,-1 -4,-5 q-3,3 -6,1 q3,-2 1,-5 q-2,-2 -3,-5 Z" fill="#8B5CF6" stroke="#6D28D9" strokeWidth={1.5} />
          <path d="M-14,-1 q-3,5 1,7" stroke="#6D28D9" strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M14,-1 q3,5 -1,7" stroke="#6D28D9" strokeWidth={5} fill="none" strokeLinecap="round" />
          <ellipse cx={0} cy={-17} rx={16} ry={19} fill="#9B6DF0" stroke="#6D28D9" strokeWidth={2.5} />
          <ellipse cx={-7} cy={-22} rx={5} ry={6} fill="#6D3BC4" opacity={0.9} />
          <ellipse cx={6} cy={-11} rx={4.5} ry={5} fill="#6D3BC4" opacity={0.9} />
          <ellipse cx={-12} cy={-34} rx={4} ry={2.5} fill="#8B5CF6" transform="rotate(-25 -12 -34)" />
          <ellipse cx={12} cy={-34} rx={4} ry={2.5} fill="#8B5CF6" transform="rotate(25 12 -34)" />
          <path d="M-10,-40 q-7,-2 -8,-8 q5,2 9,5 Z" fill="#EDE3FF" stroke="#B6A4E6" strokeWidth={1} />
          <path d="M10,-40 q7,-2 8,-8 q-5,2 -9,5 Z" fill="#EDE3FF" stroke="#B6A4E6" strokeWidth={1} />
          <ellipse cx={0} cy={-33} rx={12} ry={10} fill="#A77DF4" stroke="#6D28D9" strokeWidth={2} />
          <ellipse cx={0} cy={-29} rx={9} ry={6} fill="#C9B2F7" />
          <ellipse cx={-3.5} cy={-28} rx={1.4} ry={2} fill="#5B21B6" />
          <ellipse cx={3.5} cy={-28} rx={1.4} ry={2} fill="#5B21B6" />
          <ellipse cx={-4.5} cy={-37} rx={2.6} ry={3} fill="#ffffff" />
          <ellipse cx={4.5} cy={-37} rx={2.6} ry={3} fill="#ffffff" />
          <circle cx={-4} cy={-37} r={1.5} fill="#3a1e6e" />
          <circle cx={5} cy={-37} r={1.5} fill="#3a1e6e" />
          <path d="M-8,-41 l5,2" stroke="#5B21B6" strokeWidth={2} strokeLinecap="round" />
          <path d="M8,-41 l-5,2" stroke="#5B21B6" strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "mermaid":
      return (
        <>
          <path d="M6,-2 q14,2 16,-12 q-8,1 -11,7 q-2,4 -5,5 Z" fill="#3FB5A8" stroke="#2E8A80" strokeWidth={1.5} />
          <path d="M-9,-10 Q-11,2 0,2 Q11,2 9,-10 Z" fill="#46B0A0" stroke="#2E8A80" strokeWidth={1.5} />
          <ellipse cx={0} cy={-9} rx={9} ry={7} fill="#5BBBAA" />
          <path d="M-8,-14 Q-9,-28 0,-30 Q9,-28 8,-14 Q4,-11 0,-11 Q-4,-11 -8,-14 Z" fill="#BCE6D8" stroke="#7FC6B0" strokeWidth={1.5} />
          <path d="M-9,-28 q-6,5 -3,12" stroke="#4E9A6A" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M9,-28 q6,5 3,12" stroke="#4E9A6A" strokeWidth={3} fill="none" strokeLinecap="round" />
          <circle cx={0} cy={-33} r={8} fill="#D8F0E4" stroke="#8FCBB0" strokeWidth={1.2} />
          <path d="M-6,-39 q4,-5 8,-2 q3,-4 6,1" stroke="#4E9A6A" strokeWidth={3} fill="none" strokeLinecap="round" />
          <circle cx={-4} cy={-33} r={2.6} fill="none" stroke="#3a5a4a" strokeWidth={1.3} />
          <circle cx={-4} cy={-33} r={0.8} fill="#3a5a4a" />
          <circle cx={4} cy={-33} r={2.6} fill="none" stroke="#3a5a4a" strokeWidth={1.3} />
          <circle cx={4} cy={-33} r={0.8} fill="#3a5a4a" />
          <path d="M-3,-27 q3,2 6,0" stroke="#3a5a4a" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <path d="M6,-44 q5,-2 4,3 q-3,1 -4,-1" stroke="#9FD3C0" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <circle cx={-9} cy={-26} r={2} fill="#A6D8C4" opacity={0.7} />
        </>
      );
    case "eel":
      return (
        <>
          <path d="M-16,-4 Q-10,-14 -2,-10 Q6,-6 10,-16 Q13,-22 18,-22" stroke="#F7D23A" strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d="M-16,-4 Q-10,-14 -2,-10 Q6,-6 10,-16 Q13,-22 18,-22" stroke="#FFE680" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
          <circle cx={19} cy={-23} r={6} fill="#F7D23A" stroke="#E0B020" strokeWidth={1.5} />
          <circle cx={18} cy={-24} r={1.5} fill="#5a4410" />
          <path d="M16,-20 q3,1 5,0" stroke="#5a4410" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <path d="M-4,-26 l3,-5 l-1,4 l3,-1 l-4,6 l1,-4 Z" fill="#FFF0A0" stroke="#F0D040" strokeWidth={0.6} />
          <circle cx={6} cy={-22} r={1.4} fill="#FFF6C0" />
          <path d="M24,-31 l2,-3 l0,3 l2,-1" stroke="#FFF0A0" strokeWidth={1.3} fill="none" strokeLinecap="round" />
        </>
      );
    case "koi":
      return (
        <>
          <path d="M-14,-14 q-10,-6 -14,-2 q4,2 4,5 q-6,1 -8,5 q10,2 18,-3 Z" fill="#F7C95A" stroke="#D9921E" strokeWidth={1.2} />
          <path d="M-14,-14 Q-2,-30 14,-20 Q22,-15 14,-10 Q-2,0 -14,-14 Z" fill="#F4B843" stroke="#D9921E" strokeWidth={2} strokeLinejoin="round" />
          <path d="M-2,-26 q4,-6 8,-3 q-2,3 -4,4 Z" fill="#F7C95A" stroke="#D9921E" strokeWidth={1} />
          <path d="M2,-14 q2,6 8,7 q-1,-5 -3,-8 Z" fill="#FBD879" opacity={0.9} />
          <path d="M0,-18 q3,3 0,6" stroke="#E0A82E" strokeWidth={1} fill="none" opacity={0.6} />
          <path d="M6,-18 q3,3 0,6" stroke="#E0A82E" strokeWidth={1} fill="none" opacity={0.6} />
          <circle cx={14} cy={-16} r={2.2} fill="#ffffff" />
          <circle cx={14.5} cy={-16} r={1.2} fill="#4a3410" />
          <path d="M8,-24 l1,-2.5 l1,2.5 l2.5,1 l-2.5,1 l-1,2.5 l-1,-2.5 l-2.5,-1 Z" fill="#FFF6C2" />
          <circle cx={-4} cy={-20} r={1} fill="#ffffff" opacity={0.8} />
        </>
      );
    case "narcissus":
      return (
        <>
          <rect x={-2.5} y={-12} width={5} height={14} rx={2.5} fill="#C9A24A" stroke="#A07E2E" strokeWidth={1} />
          <ellipse cx={0} cy={-24} rx={13} ry={15} fill="#5FB0A0" stroke="#3E8A78" strokeWidth={3} />
          <ellipse cx={0} cy={-24} rx={9} ry={11} fill="#CFEAF2" stroke="#A8D4E0" strokeWidth={1} />
          <path d="M-5,-30 q6,4 4,12" stroke="#ffffff" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
          <circle cx={-3} cy={-25} r={1.4} fill="#5a7a82" />
          <circle cx={3} cy={-25} r={1.4} fill="#5a7a82" />
          <path d="M-3,-20 q3,2 6,0" stroke="#5a7a82" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <g transform="translate(0,-40)">
            <circle cx={0} cy={-3.5} r={2.2} fill="#ffffff" />
            <circle cx={3.3} cy={-1} r={2.2} fill="#ffffff" />
            <circle cx={2} cy={3} r={2.2} fill="#ffffff" />
            <circle cx={-2} cy={3} r={2.2} fill="#ffffff" />
            <circle cx={-3.3} cy={-1} r={2.2} fill="#ffffff" />
            <circle cx={0} cy={0} r={2.4} fill="#F4C24A" />
          </g>
        </>
      );
    case "doll":
      return (
        <>
          <path d="M-11,-6 q-6,-4 -5,-10" stroke="#B9B3CC" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M11,-6 q6,-4 5,-10" stroke="#B9B3CC" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M-11,0 Q-13,-12 0,-13 Q13,-12 11,0 Z" fill="#B9B3CC" stroke="#8A84A6" strokeWidth={1.5} />
          <line x1={0} y1={-13} x2={0} y2={-1} stroke="#9A94B8" strokeWidth={1} strokeDasharray="2 2" />
          <circle cx={0} cy={-24} r={11} fill="#C7C2D8" stroke="#8A84A6" strokeWidth={1.5} />
          <line x1={0} y1={-35} x2={0} y2={-41} stroke="#8A84A6" strokeWidth={1.5} />
          <circle cx={0} cy={-43} r={2.4} fill="#E8A0C0" />
          <circle cx={-4} cy={-25} r={1.8} fill="#3a3550" />
          <circle cx={4} cy={-25} r={1.8} fill="#3a3550" />
          <path d="M-7,-29 l5,2" stroke="#3a3550" strokeWidth={1.6} strokeLinecap="round" />
          <path d="M7,-29 l-5,2" stroke="#3a3550" strokeWidth={1.6} strokeLinecap="round" />
          <path d="M-3,-19 q3,-3 6,0" stroke="#3a3550" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <ellipse cx={-7} cy={-21} rx={2.4} ry={1.6} fill="#E8A0C0" opacity={0.8} />
          <ellipse cx={7} cy={-21} rx={2.4} ry={1.6} fill="#E8A0C0" opacity={0.8} />
        </>
      );
    case "mole":
      return (
        <>
          <ellipse cx={0} cy={-13} rx={14} ry={14} fill="#E8A8A0" stroke="#C88078" strokeWidth={1.8} />
          <ellipse cx={0} cy={-9} rx={9} ry={9} fill="#F2C0B8" opacity={0.7} />
          <path d="M-14,-10 l-6,3 l5,2 l-5,3" stroke="#B0A8A0" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14,-10 l6,3 l-5,2 l5,3" stroke="#B0A8A0" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-13,-28 Q0,-34 13,-28 Q13,-23 -13,-23 Z" fill="#F2C84A" stroke="#D9A828" strokeWidth={1.5} />
          <path d="M-9,-28 Q0,-38 9,-28 Z" fill="#F2C84A" stroke="#D9A828" strokeWidth={1.5} />
          <ellipse cx={0} cy={-15} rx={4.5} ry={3.5} fill="#E07A88" />
          <circle cx={0} cy={-15} r={1.2} fill="#7a3a44" />
          <path d="M-6,-20 q2,-1 4,0" stroke="#7a4a44" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <path d="M2,-20 q2,-1 4,0" stroke="#7a4a44" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <path d="M9,-34 l5,0 l-5,4 l5,0" stroke="#9AA0A8" strokeWidth={1.2} fill="none" strokeLinejoin="round" />
        </>
      );
    case "goblin":
      return (
        <>
          <path d="M-9,-26 l-6,-2 l4,5 Z" fill="#E0602E" stroke="#A83A18" strokeWidth={1} />
          <path d="M9,-26 l6,-2 l-4,5 Z" fill="#E0602E" stroke="#A83A18" strokeWidth={1} />
          <path d="M-11,0 Q-13,-16 0,-20 Q13,-16 11,0 Z" fill="#D9542A" stroke="#A83A18" strokeWidth={1.5} />
          <path d="M-11,0 Q-12,-7 -8,-12 L8,-12 Q12,-7 11,0 Z" fill="#3A332E" opacity={0.85} />
          <circle cx={-9} cy={-4} r={1.4} fill="#FF8A3A" opacity={0.8} />
          <circle cx={7} cy={-3} r={1.2} fill="#FF8A3A" opacity={0.8} />
          <circle cx={0} cy={-26} r={9} fill="#E0602E" stroke="#A83A18" strokeWidth={1.5} />
          <path d="M-7,-32 l-3,-7 l5,4 Z" fill="#5A4A40" stroke="#3A332E" strokeWidth={1} />
          <path d="M7,-32 l3,-7 l-5,4 Z" fill="#5A4A40" stroke="#3A332E" strokeWidth={1} />
          <ellipse cx={-4} cy={-26} rx={2} ry={2.4} fill="#FFD24A" />
          <ellipse cx={4} cy={-26} rx={2} ry={2.4} fill="#FFD24A" />
          <circle cx={-4} cy={-26} r={0.9} fill="#7a3a10" />
          <circle cx={4} cy={-26} r={0.9} fill="#7a3a10" />
          <path d="M-4,-21 q4,3 8,0" stroke="#7a2a10" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <path d="M0,-36 q-2,-5 0,-8 q3,3 2,6 Z" fill="#FF8A3A" />
          <path d="M6,-34 q3,-3 1,-7" stroke="#8A8078" strokeWidth={1.2} fill="none" opacity={0.6} />
        </>
      );
    case "goldgolem":
      return (
        <>
          <circle cx={-18} cy={-24} r={7} fill="#E8B84A" stroke="#B88A1E" strokeWidth={1.5} />
          <circle cx={18} cy={-24} r={7} fill="#E8B84A" stroke="#B88A1E" strokeWidth={1.5} />
          <path d="M-17,0 Q-20,-24 -13,-34 Q0,-40 13,-34 Q20,-24 17,0 Z" fill="#E8B84A" stroke="#B88A1E" strokeWidth={2} />
          <path d="M-8,-6 L-4,-26" stroke="#FFE89A" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
          <path d="M0,-22 l4,5 l-4,5 l-4,-5 Z" fill="#7FD0E0" stroke="#4E9AA8" strokeWidth={1} />
          <rect x={-10} y={-50} width={20} height={17} rx={4} fill="#F0C658" stroke="#B88A1E" strokeWidth={2} />
          <line x1={-10} y1={-46} x2={10} y2={-46} stroke="#B88A1E" strokeWidth={1.5} />
          <ellipse cx={-4} cy={-42} rx={2} ry={2.4} fill="#ffffff" />
          <ellipse cx={4} cy={-42} rx={2} ry={2.4} fill="#ffffff" />
          <circle cx={-4} cy={-41} r={1} fill="#6a4a10" />
          <circle cx={4} cy={-41} r={1} fill="#6a4a10" />
          <path d="M-4,-37 q4,-2 8,0" stroke="#8a6a18" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <path d="M11,-45 q2,4 0,5 q-2,-1 0,-5 Z" fill="#9FD8E8" opacity={0.85} />
          <path d="M-12,-48 l1,-2.5 l1,2.5 l2.5,1 l-2.5,1 l-1,2.5 l-1,-2.5 l-2.5,-1 Z" fill="#FFF8D8" />
        </>
      );
    default:
      return null;
  }
}

function Hedge({ x, y, theme }: { x: number; y: number; theme: DungeonTheme }) {
  return (
    <g>
      <ellipse cx={x} cy={y - 2} rx={27} ry={12} fill={theme.hedgeBase} opacity={0.25} />
      <ellipse cx={x} cy={y - 3} rx={25} ry={11} fill={theme.hedgeBase} />
      <circle cx={x - 10} cy={y - 13} r={13} fill={theme.hedgeMid} />
      <circle cx={x + 10} cy={y - 12} r={13} fill={theme.hedgeBase} />
      <circle cx={x} cy={y - 21} r={13} fill={theme.hedgeLight} />
      <circle cx={x - 4} cy={y - 24} r={3} fill={theme.hedgeLight} opacity={0.7} />
    </g>
  );
}

function Banner({ label, theme }: { label: string; theme: DungeonTheme }) {
  const w = Math.max(106, label.length * 15 + 34);
  return (
    <g>
      <rect x={40} y={22} width={w} height={28} rx={8} fill="#ffffff" fillOpacity={0.92} stroke={theme.bannerStroke} strokeWidth={1} />
      <text x={40 + w / 2} y={40} textAnchor="middle" fontSize={14} fill={theme.bannerText}>{label}</text>
    </g>
  );
}

function Monster({
  m,
  idx,
  onClick,
  respawnLeft,
}: {
  m: MonsterPlacement;
  idx: number;
  onClick?: () => void;
  /** >0 = 死亡中，顯示倒數；null/undefined/0 = 存活。 */
  respawnLeft?: number | null;
}) {
  const { x, y } = iso(m.col, m.row);
  const cx = x;
  const cy = y + TH / 2;
  const dur = m.isBoss ? 2.6 : DURATIONS[idx % DURATIONS.length];
  const del = m.isBoss ? 0 : DELAYS[idx % DELAYS.length];
  const w = m.name.length * 13 + 18;
  const below = m.isBoss ? true : m.labelBelow;
  const pillY = below ? 30 : m.sprite === "rabbit" ? -72 : -58;
  const eliteBadgeY = below ? -64 : pillY - 24;
  const pc = PILL[m.sprite];
  const bossLabel = m.bossLabel ?? "小boss";
  const bw = bossLabel.length * 12 + 16;

  const dead = respawnLeft != null && respawnLeft > 0;
  const clickable = !dead && !!onClick;

  // 死亡中：只顯示淡灰殘影 + 重生倒數膠囊，不可點、不彈跳、不發光
  if (dead) {
    return (
      <g transform={`translate(${cx},${cy})`} style={{ pointerEvents: "none" }}>
        <ellipse cx={0} cy={0} rx={13} ry={5} fill="#000000" opacity={0.12} />
        <g style={{ filter: "grayscale(1)", opacity: 0.28 }}>
          <Sprite kind={m.sprite} />
        </g>
        <g>
          <rect x={-34} y={pillY - 11} width={68} height={22} rx={11} fill="#6B7280" fillOpacity={0.92} stroke="#4B5563" strokeWidth={1} />
          <text x={0} y={pillY + 4} textAnchor="middle" fontSize={12} fill="#F9FAFB">
            ⏱ {Math.ceil(respawnLeft as number)}s
          </text>
        </g>
      </g>
    );
  }

  return (
    <g transform={`translate(${cx},${cy})`}>
      <g
        className={clickable ? "bp-click" : undefined}
        onClick={clickable ? onClick : undefined}
        style={clickable ? { cursor: "pointer" } : undefined}
      >
        {/* 透明點擊熱區：確保整隻怪（含透明處）都能點到 */}
        {clickable && <rect x={-24} y={-52} width={48} height={64} fill="transparent" />}

        {m.isBoss && (
          <g className="bp-aura" style={{ animation: "bp-aura 1.9s ease-in-out infinite" }}>
            <ellipse cx={0} cy={0} rx={26} ry={11} fill="#FCD34D" opacity={0.22} />
            <ellipse cx={0} cy={0} rx={26} ry={11} fill="none" stroke="#D9A21E" strokeWidth={2} opacity={0.6} />
          </g>
        )}
        {m.isElite && (
          <g className="bp-aura" style={{ animation: "bp-aura 1.6s ease-in-out infinite" }}>
            <ellipse cx={0} cy={0} rx={26} ry={11} fill="#A78BFA" opacity={0.2} />
            <ellipse cx={0} cy={0} rx={26} ry={11} fill="none" stroke="#8B5CF6" strokeWidth={2} opacity={0.55} />
          </g>
        )}
        <ellipse className="bp-sh" cx={0} cy={0} rx={15} ry={6} fill="#000000" opacity={0.26} style={{ animation: `bp-sh ${dur}s ease-in-out infinite ${del}s` }} />
        <g className="bp-hop" style={{ animation: `${m.isBoss ? "bp-boss" : "bp-hop"} ${dur}s ease-in-out infinite ${del}s` }}>
          <Sprite kind={m.sprite} />
        </g>
        {m.isBoss && (
          <g transform="translate(0,-56)">
            <path d="M-9,-2 L-9,-10 L-4,-5 L0,-12 L4,-5 L9,-10 L9,-2 Z" fill="#FFD24A" stroke="#D9A21E" strokeWidth={1} />
            <circle cx={0} cy={-12} r={1.6} fill="#FFF0B0" />
          </g>
        )}
        {m.isElite &&
          ELITE_SPARKS.map((s, i) => (
            <g key={`sp-${i}`} transform={`translate(${s.x},${s.y})`}>
              <path className="bp-spark" d="M0,-5 L1.4,-1.4 L5,0 L1.4,1.4 L0,5 L-1.4,1.4 L-5,0 L-1.4,-1.4 Z" fill="#C4B5FD" style={{ animation: `bp-spark 1.8s ease-in-out infinite ${s.d}s` }} />
            </g>
          ))}
        <rect x={-w / 2} y={pillY - 11} width={w} height={22} rx={11} fill="#ffffff" fillOpacity={0.95} stroke={m.isBoss ? "#D9A21E" : m.isElite ? "#7C3AED" : pc.border} strokeWidth={m.isBoss ? 2 : m.isElite ? 1.6 : 1.2} />
        <text x={0} y={pillY + 4} textAnchor="middle" fontSize={12} fill={pc.text}>{m.name}</text>
        {m.isElite && (
          <g>
            <rect x={-20} y={eliteBadgeY - 9} width={40} height={18} rx={9} fill="#7C3AED" stroke="#5B21B6" strokeWidth={1} />
            <text x={0} y={eliteBadgeY + 4} textAnchor="middle" fontSize={11} fill="#F3E8FF">菁英</text>
          </g>
        )}
        {m.isBoss && (
          <g>
            <rect x={-bw / 2} y={-89} width={bw} height={18} rx={9} fill="#D9A21E" stroke="#9A6E12" strokeWidth={1} />
            <text x={0} y={-76} textAnchor="middle" fontSize={11} fill="#FFF7E0">{bossLabel}</text>
          </g>
        )}
      </g>
    </g>
  );
}

export default function IsometricDungeonMap({
  level,
  onMonsterClick,
  respawning,
  grandma,
}: {
  level: DungeonLevel;
  /** 點擊存活怪物時觸發，回報該怪資料與索引。不傳則為純展示。 */
  onMonsterClick?: (monster: MonsterPlacement, index: number) => void;
  /** 索引 → 剩餘重生秒數。傳入後該怪變灰、顯示倒數、不可點。由遊戲 store 管理。 */
  respawning?: Record<number, number>;
  /** 幻影阿嬤（成就武器「阿嬤的怒吼」配戴時）。傳入位置與當前台詞則顯示；null/不傳則不顯示。
   *  x,y 為 viewBox(680×370) 座標，會跟著地圖縮放。出沒時機/位置/台詞由 app 控制。
   *  阿嬤不可點、pointer-events:none，不會擋到後面的怪。 */
  grandma?: { x: number; y: number; quote: string } | null;
}) {
  const theme: DungeonTheme = { ...GRASS_THEME, ...(level.theme || {}) };
  const rows = level.grid.length;
  const cols = level.grid[0]?.length ?? 0;

  const cells: { c: number; r: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push({ c, r });
  }
  cells.sort((a, b) => a.c + a.r - (b.c + b.r));

  return (
    <svg width="100%" viewBox="0 0 680 370" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>{level.label}</title>
      <desc>等角投影呈現的關卡地圖，怪物站在各角落彈跳。</desc>
      <style>{`
        @keyframes bp-hop{0%,100%{transform:translateY(0) scale(1,1)}14%{transform:translateY(0) scale(1.08,.9)}45%{transform:translateY(-20px) scale(.95,1.07)}68%{transform:translateY(0) scale(1.1,.86)}84%{transform:translateY(0) scale(.97,1.03)}}
        @keyframes bp-sh{0%,100%{transform:scale(1);opacity:.26}45%{transform:scale(.68);opacity:.14}68%{transform:scale(1.06);opacity:.28}}
        @keyframes bp-aura{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.13);opacity:.85}}
        @keyframes bp-spark{0%{transform:translateY(4px) scale(.5);opacity:0}30%{opacity:.95}100%{transform:translateY(-16px) scale(1);opacity:0}}
        @keyframes bp-boss{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-6px) scale(1.02,.98)}}
        .bp-hop,.bp-sh,.bp-aura,.bp-spark{transform-box:fill-box}
        .bp-hop{transform-origin:50% 100%}
        .bp-sh,.bp-aura,.bp-spark{transform-origin:50% 50%}
        .bp-click{cursor:pointer}
        .bp-click:hover .bp-hop{filter:brightness(1.15)}
        .bp-click:active{opacity:.8}
        @keyframes bp-gma-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes bp-gma-glow{0%,100%{opacity:.45}50%{opacity:.8}}
        .bp-gma-body{transform-box:fill-box;transform-origin:50% 100%}
        @media (prefers-reduced-motion: no-preference){
          .bp-gma-body{animation:bp-gma-float 3.2s ease-in-out infinite}
          .bp-gma-aura{animation:bp-gma-glow 3.2s ease-in-out infinite}
        }
        @media (prefers-reduced-motion: reduce){.bp-hop,.bp-sh,.bp-aura,.bp-spark{animation:none !important}}
      `}</style>

      <ellipse cx={340} cy={316} rx={196} ry={30} fill="#000000" opacity={0.07} />

      {cells.map(({ c, r }) => {
        const cell = level.grid[r][c];
        const { x, y } = iso(c, r);
        const isLava = cell === "L";
        const topCol = isLava ? theme.lavaTop ?? "#E8622C" : (c + r) % 2 ? theme.tileTopB : theme.tileTopA;
        return (
          <g key={`t-${c}-${r}`}>
            <polygon points={`${x - TW / 2},${y + TH / 2} ${x},${y + TH} ${x},${y + TH + DEPTH} ${x - TW / 2},${y + TH / 2 + DEPTH}`} fill={theme.tileLeft} />
            <polygon points={`${x},${y + TH} ${x + TW / 2},${y + TH / 2} ${x + TW / 2},${y + TH / 2 + DEPTH} ${x},${y + TH + DEPTH}`} fill={theme.tileRight} />
            <polygon points={`${x},${y} ${x + TW / 2},${y + TH / 2} ${x},${y + TH} ${x - TW / 2},${y + TH / 2}`} fill={topCol} stroke={theme.tileTopStroke} strokeWidth={0.75} strokeOpacity={0.6} />
            {isLava && (
              <polygon points={`${x},${y + TH / 4} ${x + TW / 4},${y + TH / 2} ${x},${y + (3 * TH) / 4} ${x - TW / 4},${y + TH / 2}`} fill={theme.lavaHot ?? "#FFA94A"} opacity={0.85} />
            )}
            {cell === "H" && <Hedge x={x} y={y + TH / 2} theme={theme} />}
          </g>
        );
      })}

      <Banner label={level.label} theme={theme} />

      {level.monsters.map((m, i) => (
        <Monster
          key={`${m.name}-${i}`}
          m={m}
          idx={i}
          onClick={onMonsterClick ? () => onMonsterClick(m, i) : undefined}
          respawnLeft={respawning ? respawning[i] : undefined}
        />
      ))}

      {/* 幻影阿嬤圖層：不可點、pointer-events:none，不擋後面的怪（GDD §9.7）*/}
      {grandma && (
        <g transform={`translate(${grandma.x},${grandma.y})`} style={{ pointerEvents: "none" }}>
          <g className="bp-gma-body">
            <ellipse className="bp-gma-aura" cx={0} cy={-24} rx={28} ry={34} fill="#CFE9F4" opacity={0.45} />
            <GrandmaSprite />
          </g>
          {(() => {
            const w = Math.max(110, grandma.quote.length * 16 + 28);
            return (
              <g transform="translate(0,-62)">
                <rect x={-w / 2} y={-16} width={w} height={32} rx={16} fill="#ffffff" fillOpacity={0.96} stroke="#9FBFCE" strokeWidth={1.5} />
                <path d="M-6,15 L0,26 L8,15 Z" fill="#ffffff" stroke="#9FBFCE" strokeWidth={1.5} />
                <text x={0} y={5} textAnchor="middle" fontSize={15} fill="#4A6470">{grandma.quote}</text>
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

/** B1 草原關卡資料 (示範用，可直接拿來測試)。 */
export const B1_GRASSLAND: DungeonLevel = {
  id: "B1",
  label: "B1 · 草原",
  grid: [
    ["P", ".", "H", ".", "P"],
    [".", "H", ".", "H", "."],
    ["H", ".", ".", ".", "H"],
    [".", "H", ".", "H", "."],
    ["P", ".", "H", ".", "P"],
  ],
  monsters: [
    { col: 0, row: 0, name: "失業的史萊姆", sprite: "slime", hp: 45, exp: 25 },
    { col: 4, row: 0, name: "忘記台詞的森林精靈", sprite: "sprite", hp: 50, exp: 28 },
    { col: 0, row: 4, name: "喝到打嗝的露水兔", sprite: "rabbit", hp: 55, exp: 30 },
    { col: 4, row: 4, name: "迷路的風之雛鳥", sprite: "chick", hp: 60, exp: 32, labelBelow: true },
  ],
};

/** B4 火山熔岩主題：暗黑玄武岩地面 + 熔岩格。 */
export const LAVA_THEME: Partial<DungeonTheme> = {
  tileTopA: "#5A4038",
  tileTopB: "#4E372F",
  tileTopStroke: "#8A5A3A",
  tileLeft: "#33231E",
  tileRight: "#45302A",
  hedgeBase: "#3A2E2A",
  hedgeMid: "#4E3E37",
  hedgeLight: "#5E4A40",
  bannerText: "#9A3A12",
  bannerStroke: "#C8662A",
  lavaTop: "#E8622C",
  lavaHot: "#FFA94A",
};

/** B4 火山熔岩關卡資料。boss 置中，火蜥蜴示範菁英狀態。 */
export const B4_VOLCANO: DungeonLevel = {
  id: "B4",
  label: "B4 · 火山熔岩",
  theme: LAVA_THEME,
  grid: [
    ["P", ".", "H", ".", "P"],
    [".", "H", "L", "H", "."],
    ["H", ".", ".", ".", "H"],
    [".", "H", "L", "H", "."],
    ["P", ".", "H", ".", "P"],
  ],
  monsters: [
    { col: 0, row: 0, name: "過勞的鳳凰", sprite: "phoenix", hp: 750, exp: 420 },
    { col: 4, row: 0, name: "燒聲的火蜥蜴", sprite: "salamander", hp: 1700, exp: 1000, isElite: true },
    { col: 0, row: 4, name: "鍛造到鐵腕痠痛的熔岩矮人", sprite: "dwarf", hp: 820, exp: 450 },
    { col: 4, row: 4, name: "被自己帥醒的炎之魔像", sprite: "golem", hp: 3500, exp: 3000, isBoss: true },
  ],
};

/** B5 元素之巔主題：高處的薄霧石台 + 雲牆。 */
export const ELEMENT_THEME: Partial<DungeonTheme> = {
  tileTopA: "#AEC7D6",
  tileTopB: "#9FBBCB",
  tileTopStroke: "#6E8C9E",
  tileLeft: "#5E7686",
  tileRight: "#74909E",
  hedgeBase: "#C8D4E4",
  hedgeMid: "#DCE6F2",
  hedgeLight: "#EEF3FA",
  bannerText: "#3A4E6E",
  bannerStroke: "#7C8FB5",
};

/** B5 元素之巔關卡資料。亞龍為小 boss，破壞神(牛)為最終魔王。 */
export const B5_PEAK: DungeonLevel = {
  id: "B5",
  label: "B5 · 元素之巔",
  theme: ELEMENT_THEME,
  grid: [
    ["P", ".", "P", ".", "P"],
    [".", "H", ".", "H", "."],
    [".", ".", "H", ".", "."],
    [".", "H", ".", "H", "."],
    ["P", ".", ".", ".", "P"],
  ],
  monsters: [
    { col: 0, row: 0, name: "運勢不順的元素殘渣", sprite: "residue", hp: 1550, exp: 1250 },
    { col: 2, row: 0, name: "亂流裡的迷途風靈", sprite: "windspirit", hp: 1500, exp: 1200 },
    { col: 4, row: 0, name: "自帶BGM的雷霆鷲", sprite: "eagle", hp: 1600, exp: 1300 },
    { col: 0, row: 4, name: "討厭看排名的亞龍", sprite: "wyvern", hp: 5000, exp: 6000, isBoss: true },
    { col: 4, row: 4, name: "尾巴打結的破壞神", sprite: "destroyer", hp: 12000, exp: 20000, isBoss: true, bossLabel: "魔王" },
  ],
};

/** B3 森林湖泊主題：青苔湖畔石台 + 蘆葦牆，'L' 格重新利用為閃動湖水。 */
export const FOREST_LAKE_THEME: Partial<DungeonTheme> = {
  tileTopA: "#7BC49A",
  tileTopB: "#6FBB90",
  tileTopStroke: "#4E9A78",
  tileLeft: "#3E8A6A",
  tileRight: "#569A78",
  hedgeBase: "#3E8A5A",
  hedgeMid: "#4E9A66",
  hedgeLight: "#5CA774",
  bannerText: "#2A6B4E",
  bannerStroke: "#4E9A78",
  lavaTop: "#5AB6D8",
  lavaHot: "#9FE0F0",
};

/** B3 森林湖泊關卡資料。四隻皆為一般怪，中央為湖水。 */
export const B3_LAKE: DungeonLevel = {
  id: "B3",
  label: "B3 · 森林湖泊",
  theme: FOREST_LAKE_THEME,
  grid: [
    ["P", ".", "H", ".", "P"],
    [".", "H", "L", "H", "."],
    ["H", "L", "L", "L", "H"],
    [".", "H", "L", "H", "."],
    ["P", ".", "H", ".", "P"],
  ],
  monsters: [
    { col: 0, row: 0, name: "暈船的人魚", sprite: "mermaid", hp: 58, exp: 33 },
    { col: 4, row: 0, name: "不能蒲燒的電鰻", sprite: "eel", hp: 62, exp: 37 },
    { col: 0, row: 4, name: "金鏶鏶的金鱗鯉", sprite: "koi", hp: 66, exp: 36 },
    { col: 4, row: 4, name: "在湖面照鏡子的水仙精", sprite: "narcissus", hp: 60, exp: 34, labelBelow: true },
  ],
};

/** B2 礦坑主題：暖褐岩壁 + 礦石牆，'L' 格重新利用為閃動金礦脈。 */
export const MINE_THEME: Partial<DungeonTheme> = {
  tileTopA: "#B89A6E",
  tileTopB: "#AD8E62",
  tileTopStroke: "#8A6E46",
  tileLeft: "#6E5638",
  tileRight: "#846A48",
  hedgeBase: "#6E5E4E",
  hedgeMid: "#7E6C58",
  hedgeLight: "#8E7A64",
  bannerText: "#6E4A22",
  bannerStroke: "#8A6E46",
  lavaTop: "#E8B84A",
  lavaHot: "#FFE08A",
};

/** B2 礦坑關卡資料。黃金巨像為小 boss，中央為金礦脈。 */
export const B2_MINE: DungeonLevel = {
  id: "B2",
  label: "B2 · 礦坑",
  theme: MINE_THEME,
  grid: [
    ["P", ".", "H", ".", "P"],
    [".", "H", "L", "H", "."],
    ["H", ".", "L", ".", "H"],
    [".", "H", "L", "H", "."],
    ["P", ".", "H", ".", "P"],
  ],
  monsters: [
    { col: 0, row: 0, name: "鬧脾氣的繡儀偶", sprite: "doll", hp: 75, exp: 40 },
    { col: 4, row: 0, name: "挖到躺平的鼴鼠哥工頭", sprite: "mole", hp: 60, exp: 34 },
    { col: 0, row: 4, name: "燒到一半的木炭哥布林", sprite: "goblin", hp: 65, exp: 38 },
    { col: 4, row: 4, name: "差點被拐到當鋪的黃金巨像", sprite: "goldgolem", hp: 420, exp: 360, isBoss: true },
  ],
};

// ============================================================================
// StandaloneDungeonDemo — 自帶「點擊→倒數→重生」邏輯的示範外殼
// ----------------------------------------------------------------------------
// 給 vi 預覽用：直接 import 這個就能看到完整互動（點怪→消失讀秒→原地復活）。
// 給 CC 參考用：真實遊戲不要用這個 demo 的內部計時，而是把 respawn 狀態交給
//   你的 game store 管理（store 已有 respawnAt 時間戳），再把
//   「索引→剩餘秒數」算出來傳進 <IsometricDungeonMap respawning={...} />。
//   點擊則用 onMonsterClick 接到你現有的「怪物資訊框 / 戰鬥 Modal」。
// 重生秒數對照 GDD §9.4：普通怪 5s、菁英 15s、BOSS 60s。
// ============================================================================
const RESPAWN_SECONDS: Record<string, number> = { normal: 5, elite: 15, boss: 60 };

function respawnSecondsFor(m: MonsterPlacement): number {
  if (m.isBoss) return RESPAWN_SECONDS.boss;
  if (m.isElite) return RESPAWN_SECONDS.elite;
  return RESPAWN_SECONDS.normal;
}

export function StandaloneDungeonDemo({
  level = B1_GRASSLAND,
  onMonsterClick,
}: {
  level?: DungeonLevel;
  /** 可選：點擊怪物時除了示範重生，也通知外部（例如打開戰鬥 Modal）。 */
  onMonsterClick?: (monster: MonsterPlacement, index: number) => void;
}) {
  // 每隻怪的「重生完成時間戳」；不在 map 裡 = 存活。
  const [respawnAt, setRespawnAt] = React.useState<Record<number, number>>({});
  const [now, setNow] = React.useState<number>(() => Date.now());

  // 每 250ms 刷新一次倒數顯示
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // 到時間自動把死亡的怪移除（復活）
  React.useEffect(() => {
    setRespawnAt((prev) => {
      let changed = false;
      const next: Record<number, number> = {};
      for (const [k, ts] of Object.entries(prev)) {
        if (ts > now) next[Number(k)] = ts;
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [now]);

  // 把時間戳換算成「剩餘秒數」傳給地圖
  const respawning: Record<number, number> = {};
  for (const [k, ts] of Object.entries(respawnAt)) {
    const left = (ts - now) / 1000;
    if (left > 0) respawning[Number(k)] = left;
  }

  const handleClick = (m: MonsterPlacement, i: number) => {
    onMonsterClick?.(m, i); // 真實遊戲在這裡開戰鬥；demo 直接示範擊殺
    setRespawnAt((prev) => ({ ...prev, [i]: Date.now() + respawnSecondsFor(m) * 1000 }));
  };

  return <IsometricDungeonMap level={level} onMonsterClick={handleClick} respawning={respawning} />;
}
