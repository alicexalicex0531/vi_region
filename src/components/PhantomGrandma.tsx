import { useEffect, useState } from "react";

/**
 * PhantomGrandma — 幻影阿嬤（成就獎勵武器召喚的神獸）
 * ------------------------------------------------------------------
 * 特性：玩家無法攻擊（無敵），會隨機出現在地圖上飄浮、碎碎念。
 * 這支元件只負責「長相 + 飄浮 + 語錄輪播」；
 * 「何時出現 / 出現在哪 / 多久消失 / 無敵判定」交給遊戲邏輯決定。
 *
 * 尺寸：阿嬤用 1.0 倍繪製（跟一般小怪同尺度，不放大）。
 *   feet(y=0) 到髮髻頂約 52 單位 → 介於史萊姆(~30) 與 兔子連耳朵(~61) 之間，
 *   屬一般小怪體型，不會比 boss / 胖龍大隻。若想更小，外層包 scale(0.85) 即可。
 *
 * 用法：
 *   <PhantomGrandma />                    // 預設語錄、預設節奏
 *   <PhantomGrandma intervalMs={3200} />  // 自訂輪播間隔
 *   <PhantomGrandma quotes={[...]} />     // 自訂台詞
 *   想直接放進等角地圖：把 <GrandmaSprite/> 當成一個 sprite 疊上去
 *   （local 座標、feet 在 y=0、置中 x=0，與其他怪物造型同格式）。
 * ------------------------------------------------------------------
 */

export const GRANDMA_QUOTES = [
  "這個還能用！不要丟！",
  "省一點！",
  "以前哪有這種東西",
  "呷飽沒？",
  "衣服怎麼穿這麼少",
  "阿嬤覺得你還很餓",
  "鞋子怎麼又破了",
  "錢要存起來",
];

/** 純造型：與其他怪物相同的 local 座標（feet 在 y=0、置中 x=0）。半透明幻影感。 */
export function GrandmaSprite({ opacity = 0.9 }: { opacity?: number } = {}) {
  return (
    <g opacity={opacity}>
      {/* 幻影光暈 */}
      <ellipse cx={0} cy={-24} rx={22} ry={28} fill="#CFE6F0" opacity={0.18} />
      <ellipse cx={0} cy={-24} rx={16} ry={22} fill="#DCEFF6" opacity={0.22} />
      {/* 幽靈裙襬（波浪底，沒有腳） */}
      <path d="M-13,-20 Q-15,-8 -13,0 Q-9,-4 -6,0 Q-2,-4 1,0 Q4,-4 8,0 Q11,-4 14,0 Q16,-8 13,-20 Z" fill="#AEC9D6" stroke="#86A8B6" strokeWidth={1.5} />
      {/* 圍裙 */}
      <path d="M-7,-20 L-8,-3 Q0,-6 8,-3 L7,-20 Z" fill="#E0ECE8" />
      <line x1={-7} y1={-15} x2={7} y2={-15} stroke="#C6D6D2" strokeWidth={1} />
      {/* 左手垂放 */}
      <path d="M-12,-26 Q-18,-22 -16,-14" stroke="#9FBFCE" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <circle cx={-16} cy={-13} r={2.6} fill="#E8D6CC" />
      {/* 上身毛衣 */}
      <path d="M-12,-19 Q-13,-31 0,-33 Q13,-31 12,-19 Q6,-15 0,-15 Q-6,-15 -12,-19 Z" fill="#9FBFCE" stroke="#7FA0B0" strokeWidth={1.5} />
      {/* 右手舉起、食指搖（碎碎念招牌動作） */}
      <path d="M12,-28 Q20,-30 20,-40" stroke="#9FBFCE" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <circle cx={20} cy={-42} r={3} fill="#E8D6CC" />
      <path d="M20,-44 l0,-6" stroke="#E8D6CC" strokeWidth={2.2} strokeLinecap="round" />
      {/* 頭 */}
      <circle cx={0} cy={-40} r={9} fill="#E8D6CC" stroke="#C8A898" strokeWidth={1.2} />
      {/* 頭髮 + 髮髻 */}
      <path d="M-9,-42 Q-10,-52 0,-52 Q10,-52 9,-42 Q6,-47 0,-47 Q-6,-47 -9,-42 Z" fill="#E4E2EC" stroke="#C4C0D6" strokeWidth={1} />
      <ellipse cx={0} cy={-52} rx={5} ry={4.5} fill="#E8E6F0" stroke="#C4C0D6" strokeWidth={1} />
      <path d="M-9,-40 q-2,4 0,7" stroke="#D8D4E4" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d="M9,-40 q2,4 0,7" stroke="#D8D4E4" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {/* 圓框眼鏡 */}
      <circle cx={-4} cy={-40} r={3} fill="#EAF4F8" stroke="#9A8A6A" strokeWidth={1.2} />
      <circle cx={4} cy={-40} r={3} fill="#EAF4F8" stroke="#9A8A6A" strokeWidth={1.2} />
      <line x1={-1} y1={-40} x2={1} y2={-40} stroke="#9A8A6A" strokeWidth={1} />
      <circle cx={-4} cy={-40} r={1.1} fill="#5a4a4a" />
      <circle cx={4} cy={-40} r={1.1} fill="#5a4a4a" />
      {/* 抿嘴 + 紅潤臉頰 */}
      <path d="M-3,-34 q3,-1.5 6,0" stroke="#B06A6A" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <ellipse cx={-6} cy={-36} rx={2} ry={1.3} fill="#E8A0A0" opacity={0.5} />
      <ellipse cx={6} cy={-36} rx={2} ry={1.3} fill="#E8A0A0" opacity={0.5} />
    </g>
  );
}

export default function PhantomGrandma({
  quotes = GRANDMA_QUOTES,
  intervalMs = 3000,
  opacity = 0.9,
}: {
  quotes?: string[];
  intervalMs?: number;
  opacity?: number;
}) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((p) => (p + 1) % quotes.length);
        setShow(true);
      }, 260);
    }, intervalMs);
    return () => clearInterval(t);
  }, [quotes.length, intervalMs]);

  const line = quotes[i];
  const bubbleW = Math.max(96, line.length * 15 + 26);

  return (
    <svg width="200" viewBox="0 0 200 240" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>幻影阿嬤</title>
      <style>{`
        @keyframes gma-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes gma-glow{0%,100%{opacity:.5}50%{opacity:.85}}
        .gma-body{transform-box:fill-box;transform-origin:50% 100%}
        .gma-bubble{transition:opacity .26s ease}
        @media (prefers-reduced-motion: no-preference){
          .gma-body{animation:gma-float 3.2s ease-in-out infinite}
          .gma-aura{animation:gma-glow 3.2s ease-in-out infinite}
        }
      `}</style>
      <defs>
        <filter id="gma-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      {/* 落地光暈 */}
      <ellipse cx={100} cy={214} rx={34} ry={9} fill="#BCD6E8" opacity={0.25} />
      {/* 飄浮幻影本體（外層定位、內層做飄浮動畫，避免 CSS transform 蓋掉定位） */}
      <g transform="translate(100,206)">
        <g className="gma-body">
          <ellipse className="gma-aura" cx={0} cy={-24} rx={26} ry={32} fill="#CFE9F4" opacity={0.45} filter="url(#gma-blur)" />
          <GrandmaSprite opacity={opacity} />
        </g>
      </g>
      {/* 語錄泡泡（自動輪播） */}
      <g className="gma-bubble" style={{ opacity: show ? 1 : 0 }} transform="translate(100,44)">
        <rect x={-bubbleW / 2} y={-16} width={bubbleW} height={32} rx={16} fill="#ffffff" fillOpacity={0.96} stroke="#9FBFCE" strokeWidth={1.5} />
        <path d="M-6,15 L0,26 L8,15 Z" fill="#ffffff" stroke="#9FBFCE" strokeWidth={1.5} />
        <text x={0} y={5} textAnchor="middle" fontSize={14} fill="#4A6470">{line}</text>
      </g>
    </svg>
  );
}
