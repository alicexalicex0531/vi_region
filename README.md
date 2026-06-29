# 背包又滿了 🎒

> 一個專治背包焦慮的奇幻可愛地下城農農樂

放置／輕回合制農材料 RPG。打怪掉素材 → 取捨背包 → 合成裝備，凹完美數值凹到背包又滿了。

- **純前端**：React + TypeScript + Vite + Zustand + Tailwind CSS，圖形全 SVG
- **存檔**：localStorage（存在玩家自己的瀏覽器；清除瀏覽資料會遺失角色）
- **平台**：網頁版（手機、電腦皆可玩），可用 Capacitor 打包成 Android APK

## 開發

```bash
npm install
npm run dev      # 本機開發（http://localhost:5173）
npm run build    # 產出 dist/（部署用）
npm run preview  # 本機預覽 production build
```

## 部署

純靜態網站，`dist/` 可直接丟任何靜態主機。本專案用 Netlify（設定見 `netlify.toml`）。

---

設計與開發：vi & Claude 🐮✨
