# 《背包又滿了》backpack-dungeon

放置/輕回合制農材料 RPG。設計文件在上層資料夾 `../backpack_full_GDD_v1.0.md`（舊版在 ../old/），
**所有機制、數值、命名以 GDD 為準**；改機制前先讀對應章節。
裝備 roll 數值＝GDD §7.3 的 `ROLL_TABLE`（四格×四階「上下限都抬」，equipment.ts），改平衡先動這張表。

## 指令

- `npm run dev` — 開發伺服器（或用 .claude/launch.json 的 preview）
- `npm run build` — tsc 型別檢查 + Vite 建置

## 架構

- React 19 + TypeScript + Vite + Zustand(persist→localStorage) + Tailwind v4
- `src/data/` — 純資料：職業/元素/稀有度（classes.ts）、素材表（materials.ts）、怪物與樓層（monsters.ts）。平衡調整只動這裡
- `src/game/battle.ts` — 戰鬥公式（GDD §2/§4）：Crit 每刀 1.5~2.0 純隨機是鐵律，永遠不可被裝備影響
- `src/store/gameStore.ts` — 全部遊戲狀態與行為；存檔 key：`backpack-dungeon-save`
- `src/components/` — UI；視覺規範見 GDD §12（奶油底 #FFF4DC、Fredoka/Noto Sans TC、手機優先 max-w-md）
  - `IsometricDungeonMap.tsx` — vi 團隊給的等距立體地圖元件（GDD §12.1，純呈現、勿改機制）；
    含 `grandma` prop（§9.7 幻影阿嬤圖層）。更新此元件時：vi 給的新版 root 檔與 src 版「非 grandma/非 React-import 部分逐行相同」，採外科手術合併、勿整份覆蓋（會丟失 import 修正）
  - `PhantomGrandma.tsx` — 阿嬤造型 GrandmaSprite ＋ GRANDMA_QUOTES（§9.7）
  - `Codex.tsx` — 白裝配方圖鑑（§7.8.6，view over store.discovered）
  - `dungeonLevels.ts` — store↔地圖橋接：`PLACEMENT_ORDER` 把元件擺位索引對到 store 怪物 id
    （B1~B4 identity、**B5 前三隻順序不同**需照表，改怪物順序時務必同步這張表，否則點怪會錯位）

## 進度

- Phase 1 完成：選職業、B1~B3 戰鬥、雙池掉落、升級、死亡計數、計時重生、背包、存檔
- Phase 2 完成：合成箱（含水替換版配方）、四格裝備、白色合成（18 隱藏配方、小字數＝材料數）、
  幸運道具、商店、倉庫、菁英怪（×2.5/6%）；數值定案見根目錄「回覆CC_配方表v1審核.md」
- Phase 3 已完成：多角色選角（9 隻、宿舍畫面、存檔 v3）、B4 火山熔岩（Lv15~20）、
  B5 元素之巔（Lv25+）含炎之魔像/亞龍/最終BOSS破壞神、傳說素材（含全元素百搭「尾巴結」anyElement）、
  菁英同層上限1隻（存檔 v4）、§12.1 等距立體地圖（DungeonView 已改用 IsometricDungeonMap）、
  v0.7 續航系統（§7.9 藥水 character.potions+buff狀態列、§7.10 回血防具詞綴 Equipment.regen、
  §12.1 隨機重生 store.positions+relocateRevived；存檔 v5）、
  v0.8（§7.8.6 白裝圖鑑 Codex、§7.8.7 全收集獎勵 store.grandmaClaimed+稱號+阿嬤的怒吼武器、
  §9.7 幻影阿嬤 DungeonView 狀態機；存檔 v6）
- 戰鬥仍是「fight() 一次模擬 + BattleModal 回放」；藥水＝戰前武裝＋補血反應式自動灌
  （戰鬥中手動喝藥水需改互動式戰鬥，尚未做，屬待 vi 決定的設計叉路）
- Phase 3 剩餘：存檔匯出/匯入、自由屬性點、B1~B3 精良元素低機率掉落（需素材變體）、Capacitor 打包 APK
- 存檔遷移：gameStore 的 migrate 已處理 v0→v2→v3，改存檔結構時務必加新版本並沿用此模式

## 已知環境坑

- 這台 Windows 機器上，vite build 在 `dist/` 已存在時會以 0xC0000409 無聲崩潰
  （疑似防毒鎖住舊產出檔，Vite 內建 emptyOutDir 觸發原生 panic）。
  build script 已改為 `tsc -b && rimraf dist && vite build`，**不要把 rimraf 拿掉**。
  若再遇到 exit code -1073740791 且毫無錯誤訊息，先檢查是否有東西鎖住輸出資料夾，不要急著怪程式碼。

## 慣例

- UI 文案全繁體中文，口吻無厘頭可愛（參考現有文案）
- vite.config base 為 `'./'`（Capacitor 打包需要，勿改回絕對路徑）
- 每次動工結束要更新 `../施工日誌.md`（蓋了什麼、測了什麼、自選的預設值、下一步）
