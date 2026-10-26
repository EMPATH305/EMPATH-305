# 🕯️ EMPATH — Every Moment As Truth Heals

> **「有些情緒不需要被解決，只需要一個地方，被好好看見。」**  
> *Some feelings do not need to be solved. They only need a place to be seen.*

🌐 **Live Sanctuary 線上體驗**：[https://empath305.github.io/EMPATH-305/](https://empath305.github.io/EMPATH-305/)  
🎨 **Behance 專案展示**：[EMPATH — Every Moment As Truth Heals](https://www.behance.net/gallery/251309763/EMPATH-Every-Moment-As-Truth-Heals?platform=direct)  
🏆 **CSSLight 國際設計畫廊收錄**：[Featured on CSSLight](https://www.csslight.com/website/74264/EMPATH)

---

## ✦ 關於 EMPATH (About the Sanctuary)

**EMPATH** 是一個沒有演算法、沒有評斷、不需註冊公開帳號的數位情緒避難所。以文學敘事與感官微互動，接住數位時代無處安放的脆弱。

### 六個房間・三段旅程 (Six Rooms, Three Movements)

| 房間 | 名稱 | 核心體驗 | 專屬網址 |
| :--- | :--- | :--- | :--- |
| **Room E** | **情緒出口** (Emotional Exit) | 匿名文字與情緒塗鴉投遞，讓沒有名字的重量被黑暗安全接住 | [`room-e.html`](https://empath305.github.io/EMPATH-305/room-e.html) |
| **Room M** | **思念映射** (Memory Mapping) | 把無法寄達的想念化作夜空座標，點擊星芒傾聽與點亮他人心事 | [`room-m.html`](https://empath305.github.io/EMPATH-305/room-m.html) |
| **Room P** | **碎片修補** (Kintsugi Repair) | 以日本「金繼（Kintsugi）」美學，與陌生人共同以金粉修補遺憾 | [`room-p.html`](https://empath305.github.io/EMPATH-305/room-p.html) |
| **Room A** | **神聖避難所** (Sacred Asylum) | 1 分鐘、1 小時或 24 小時隨風消散的流沙秘密，支援手機傾斜與吹氣感測 | [`room-a.html`](https://empath305.github.io/EMPATH-305/room-a.html) |
| **Room T** | **能量共振** (Energy Resonance) | 拒絕焦慮按讚，以真實震動心跳（Echo Pulse）與陌生人交換溫暖 | [`room-t.html`](https://empath305.github.io/EMPATH-305/room-t.html) |
| **Room H** | **靈魂歸宿** (Soul's Home) | 五分鐘無聲陪伴、私人情緒年曆、全網靈魂氣象局、跨裝置靈魂鑰匙與「給未來自己的時空信箱」 | [`room-h.html`](https://empath305.github.io/EMPATH-305/room-h.html) |

---

## ✦ 特色與無障礙設計 (Key Features)

- **👁️ 高敏感靜心模式 (Calm Mode for HSP)**：一鍵降低視覺動態與環境光暈，呵護高感官敏感者。
- **🌀 432Hz 同步呼吸引導與生成式療癒聲景**：Web Audio API 即時合成環境音與空間化水晶音回饋。
- **🛡️ 危機關懷安全網**：偵測高風險字詞時自動溫柔攔截並提供安心專線（1925 / 國際專線）快速撥號。
- **🌐 10 語系無縫切換**：支援繁中、簡中、英、日、西、法、德、烏克蘭、波蘭語。

---

## ✦ v20.2 Still Here

1. **五分鐘無聲陪伴**：Room H 新增沒有輸入框與任務的安靜空間；只統計當下五分鐘內選擇進入的人數，不收集文字或個人資料。
2. **全年私人情緒年曆**：每日情緒足跡可在 Room H 形成一整年的色彩地圖，最多保留 400 筆，且只存在目前裝置。
3. **集體哀傷日曆**：部分具有共同情緒重量的日期會出現一行低調文字，不預設每個人都以相同方式感受那一天。
4. **Room A「你不是第一個」**：投遞後只顯示累積匿名總量；已消散的留言不會被抽取、重播或重新利用。
5. **安全邊界**：陌生人信件漂流暫不開放，待 App Check、檢舉與內容安全機制完成後再推出。

---

## ✦ v20.1 信任與穩定性升級 (Trust & Stability)

1. **Room A 真正具備生命週期**：每則流沙秘密都寫入 Firestore `expireAt`；前端查詢會即時排除過期內容，安全規則限制單次讀取量並拒絕直接讀取過期文件，Firestore TTL 則負責後端自動清除。
2. **隱私預設更保守**：Firebase Analytics 預設關閉，只有使用者在隱私設定明確同意後才載入；選擇可隨時撤回。
3. **危機支援不再由語言推測地點**：使用者可獨立選擇所在地區；未選擇時導向國際支援目錄。
4. **無障礙與 SEO 修正**：獨立房間使用唯一 `h1`、語言偏好可保存並同步 `<html lang>`、互動控制符合 44px 觸控尺寸，外部連結補上安全屬性。
5. **PWA 與工程護欄**：補齊正確尺寸及 maskable 圖示、更新離線快取版本，新增零依賴自動檢查與 GitHub Actions。

### 資料與隱私說明

- 使用者不需要建立公開帳號；基礎設施仍可能產生維持服務與防止濫用所需的技術紀錄。
- Room A 到期內容會立即從網站查詢與安全規則中排除；Firestore TTL 的實體刪除是非即時的後端清理程序。
- Room A 的累積數字只記錄總投遞次數，不包含留言內容、作者或任何可還原原文的片段。
- 情緒年曆保存在目前裝置的 `localStorage`；無聲陪伴只使用五分鐘統計時間桶。
- 使用分析預設關閉，選擇儲存在目前瀏覽器的 `localStorage`。
- EMPATH 不是緊急服務或醫療替代方案；危機支援依使用者明確選擇的地區提供。

### 開發與部署

```bash
npm test
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project empath-62582
```

Firebase App Check 需要在專案主控台建立 reCAPTCHA Enterprise 金鑰並分階段觀察指標後再啟用強制執行；金鑰不應提交至此儲存庫。

## ✦ v19.3 成長與體驗升級紀錄 (Changelog)

1. **全房間獨立 SEO 與社群預覽標籤**：為 `room-e.html`～`room-h.html` 補齊獨立 `<title>`、`description`、`canonical` 與 Open Graph 標籤，並將 7 個頁面完整寫入 `sitemap.xml`。
2. **一鍵生成 IG 限動回聲卡／低語卡**：於「今晚回聲（Tonight's Echo）」與左下角「宇宙低語（`✦`）」彈窗新增一鍵生成金句圖片卡功能，並附上網站浮水印。
3. **首頁進場動畫提速與 Room H 動線優化**：將首次進場動畫由 4.1 秒縮短至 1.85 秒以降低社群導流跳出率；將「給未來的自己」時空信箱與分享卡按鈕改為預設直接顯示。
4. **修復 Service Worker 離線快取錯位**：修正 `sw.js` 導航請求覆蓋 `./index.html` 快取的問題。
