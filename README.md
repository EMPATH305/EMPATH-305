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

## ✦ v20.3 Safety Layer

1. **內容自主權**：Room E／M／P／A／T 的公開內容新增低干擾「隱藏」與「檢舉」控制；隱藏只作用於目前裝置。
2. **最小化匿名檢舉**：後端只接收內容集合、文件編號、固定原因與伺服器時間，不複製被檢舉原文，也不建立檢舉者身分。
3. **匿名操作節流**：投遞、檢舉與 Soul Key 查詢加入本機冷卻和每日上限，降低誤觸與簡單洗版。這是體驗護欄，不能取代後端防濫用。
4. **Soul Key 強化**：新鑰匙提升為 128-bit 隨機值；舊版雙區段鑰匙繼續相容。鑰匙本質仍是可存取備份的祕密，遺失後無法復原。
5. **App Check 接線**：前端已支援 reCAPTCHA Enterprise App Check；待建立並註冊正式網域金鑰後，先以監測模式蒐集驗證指標，再逐步強制執行。
6. **工程護欄**：安全層拆為獨立模組，新增節流、本機隱藏／檢舉狀態與安全規則的自動檢查。

## ✦ v20.4 Safety UX

1. **App Check 開始監測**：正式網域的 reCAPTCHA Enterprise 網站金鑰已接入前端；強制執行仍保持關閉，先確認正常流量能取得有效權杖。
2. **安全介面完整多語化**：隱藏、檢舉、原因選單與狀態提示支援繁中、簡中、英、日、西、法、德、烏克蘭及波蘭語。
3. **鍵盤與螢幕閱讀器補強**：檢舉視窗加入說明關聯、焦點循環、Esc 關閉及關閉後焦點還原。
4. **測試護欄**：新增安全介面語系與無障礙狀態的自動檢查。

## ✦ v20.5 Moderation Backend

1. **伺服器端匿名檢舉**：檢舉改由 `submitContentReport` Callable Function 接收，先驗證目標是否存在，再寫入後台。
2. **真正的速率限制**：同一來源每小時最多送出 8 次檢舉；來源位址只經 HMAC 雜湊後用於短期計數，不寫入檢舉資料。
3. **管理員審核室**：`admin.html` 使用 Google 登入與 Firebase custom claim，能保留或永久移除被檢舉內容。
4. **最小揭露與稽核**：審核頁只顯示必要摘要，不傳回完整圖片；每次處置另存不可由前端讀寫的稽核紀錄。
5. **私密設定**：唯一管理員與限流鹽值使用 Firebase Secret Manager，禁止硬寫在前端或 GitHub。

## ✦ v20.6 Moderation Readiness

1. **後台安全狀態**：審核室會直接顯示 Google 登入、管理員權限與 App Check 權杖是否通過，正式強制執行前不再只能靠猜測。
2. **待審核篩選**：可依房間、檢舉原因與 App Check 驗證狀態篩選，並以人類可讀的房間名稱取代資料庫集合名稱。
3. **穩定分頁**：後端只查詢尚未處理的檢舉，使用建立時間與文件編號作為穩定游標，每次最多讀取 30 筆，避免資料增長後漏件。
4. **手機登入備援**：Google 登入彈窗被瀏覽器封鎖時，會改用重新導向登入，提高 Safari 與 App 內建瀏覽器的相容性。
5. **安全補強**：授予管理權限時保留既有 custom claims；後台動態內容全部以 DOM API 與 `textContent` 建立，不使用 `innerHTML`。

## ✦ v20.7 Staged App Check Enforcement

1. **後台正式強制保護**：讀取待審核檢舉與執行處置現在必須攜帶有效 App Check 權杖；只有登入與管理員 claim 已不足以呼叫這兩個端點。
2. **公開功能分階段上線**：匿名檢舉仍保留 App Check 監測與每小時八次的伺服器限流，暫不強制拒絕未驗證流量，以避免 LINE、Instagram 等內建瀏覽器誤傷正常訪客。
3. **後台狀態可驗證**：管理頁會在端點實際通過強制驗證後顯示「App Check 已強制保護」，不只顯示前端初始化成功。

## ✦ v20.8 Mobile Reconnection Reliability

1. **背景返回後完整復原**：iPhone、Android 與 App 內建瀏覽器切到背景再回來時，房間即時內容、全站訪客數與 Room A 累積釋放數會一起重新訂閱。
2. **重試不再關掉計數器**：資料讀取失敗後按下重試，會重建完整即時資料生命週期，不再只恢復房間 feed。
3. **降低計數不同步**：統一 Firestore 訂閱入口，避免頁面看似恢復、但部分統計已經停止更新的半連線狀態。

## ✦ v20.9 Server-Guarded Posting

1. **新增安全投稿端點**：五個公開房間共用 `submitRoomContent` Callable Function；文字、圖像、保存時間與房間代碼都由伺服器重新驗證。
2. **雙層伺服器限流**：同一來源每 10 分鐘最多 6 次、每小時最多 12 次投稿；可完整走過五個房間一次，同時阻擋持續洗版。來源位址只以加鹽 HMAC 雜湊做短期計數，不與內容一起保存。
3. **伺服器掌控資料欄位**：星星座標、亮度與色彩、金繼狀態、流沙到期時間、溫暖回聲數都由後端產生，訪客不能自行指定。
4. **安全投稿已完整接管**：五個房間前端皆改走 Callable Function；Firestore 規則拒絕直接新增房間內容，Room A 的內容與匿名累積數字由同一個伺服器交易完成。

### 首次部署 v20.5

1. Firebase Authentication 啟用 Google 登入，並將正式網站網域加入 Authorized domains。
2. 專案切換至可部署 Cloud Functions 的 Blaze 方案，並安裝最新版 Firebase CLI。
3. 執行 `firebase functions:secrets:set ADMIN_EMAIL` 與 `firebase functions:secrets:set RATE_LIMIT_SALT`；值只在 CLI 隱藏提示中輸入。
4. 先執行 `firebase deploy --only functions`，成功後再執行 `firebase deploy --only firestore`。
5. Functions 與規則部署成功後，才合併並發布 v20.5 靜態前端，避免檢舉功能中斷。

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

Firebase App Check 的 reCAPTCHA Enterprise 網站金鑰是公開的客戶端識別值，可放入靜態網站；其安全性來自受限制的網域與後端驗證。應先觀察指標，再逐步啟用強制執行。

## ✦ v19.3 成長與體驗升級紀錄 (Changelog)

1. **全房間獨立 SEO 與社群預覽標籤**：為 `room-e.html`～`room-h.html` 補齊獨立 `<title>`、`description`、`canonical` 與 Open Graph 標籤，並將 7 個頁面完整寫入 `sitemap.xml`。
2. **一鍵生成 IG 限動回聲卡／低語卡**：於「今晚回聲（Tonight's Echo）」與左下角「宇宙低語（`✦`）」彈窗新增一鍵生成金句圖片卡功能，並附上網站浮水印。
3. **首頁進場動畫提速與 Room H 動線優化**：將首次進場動畫由 4.1 秒縮短至 1.85 秒以降低社群導流跳出率；將「給未來的自己」時空信箱與分享卡按鈕改為預設直接顯示。
4. **修復 Service Worker 離線快取錯位**：修正 `sw.js` 導航請求覆蓋 `./index.html` 快取的問題。
