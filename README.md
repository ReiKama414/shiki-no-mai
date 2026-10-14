# 春夏秋冬代行者 — Shiki no Mai

> **四季の舞** · Agents of the Four Seasons  
> 非官方粉絲向網頁體驗 · Unofficial fan tribute

以 WebGL shader 與季節色票，向喜愛的作品《春夏秋冬代行者》致敬：讓春・夏・秋・冬的代行者在畫面上輪流起舞。

---

## 免責與原作歸屬

**本專案為個人粉絲向創作，與原作／動畫官方無任何關聯。**

《春夏秋冬代行者》為 [暁 佳奈](https://4seasons-anime.com/) 原作（電撃文庫／KADOKAWA）、原作插畫 [スオウ](https://4seasons-anime.com/)、電視動畫由 [WIT STUDIO](https://www.witstudio.co.jp/) 製作。作品名稱、角色、設定等知識產權均屬原權利人所有。

官方網站：[4seasons-anime.com](https://4seasons-anime.com/)

本倉庫的 **MIT 授權僅適用於自行撰寫的程式碼與實作**；角色名、世界觀、插畫與其他受保護素材不在授權範圍內。請勿將本專案用於商業用途。

## 簡介

**Shiki no Mai（四季の舞）** 是一個全螢幕、單一構圖的四季氛圍介面。畫面以客製 fragment shader 驅動季節轉場，UI 色票與標題筆觸會隨當季一起流動。

| 季節 | 舞 | 代行者 |
|------|-----|--------|
| 春 Spring | 春の舞 | 花葉雛菊 × 姫鷹さくら |
| 夏 Summer | 夏の舞 | 葉桜瑠璃 × 葉桜あやめ |
| 秋 Autumn | 秋の舞 | 祝月撫子 × 阿左美竜胆 |
| 冬 Winter | 冬の舞 | 寒椿狼星 × 寒月凍蝶 |

## 特色

- **季節轉場**：Three.js 全螢幕平面 + 自訂 shader，依參考節奏循環與手動切換
- **色票同步**：GSAP 驅動紙色、墨色、強調色與光暈，跟隨當季
- **標題筆觸**：SVG lettering 的墨色與花瓣強調隨季節變化
- **可及性**：支援鍵盤操作、`prefers-reduced-motion`，無 WebGL 時退回靜態圖

## 技術棧

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Three.js](https://threejs.org/)（WebGL）
- [GSAP](https://gsap.com/) + ScrollTrigger
- Fontsource（Shippori Mincho、Cormorant Garamond、Noto Serif JP）

## 快速開始

需要 Node.js 18+。

```bash
npm install
npm run dev
```

開發伺服器預設綁定 `127.0.0.1`。建置與預覽：

```bash
npm run build
npm run preview
```

## 操作

| 操作 | 行為 |
|------|------|
| 滾輪 | 切換季節 |
| 左右／上下方向鍵 | 切換季節 |
| 觸控滑動 | 切換季節 |
| 底部 春／夏／秋／冬 | 直接選季 |

## 專案結構

```
src/
  App.tsx          # 主介面與互動
  SeasonScene.ts   # Three.js 場景與季節時間軸
  shaders.ts       # 頂點／片段著色器
  seasons.ts       # 季節資料、色票、參考圖
  TitleMark.tsx    # 標題 SVG lettering
  style.css        # 氛圍、排版、動效
references/        # 四季氛圍參考圖（非官方素材）
```

## 授權

本倉庫程式碼以 [MIT License](LICENSE) 釋出。

原作 IP、角色與任何第三方插畫／素材之權利仍屬各自權利人；公開再散布前請自行確認。
