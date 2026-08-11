# Backend Cloudflare + Firebase + Google Sheets

Kiến trúc hiện tại:

```text
Cloudflare Worker + Assets  giao diện, tài nguyên tĩnh và API cùng một deployment
Worker routes               kiểm tra dữ liệu, chống spam, URL thiệp riêng
Cloud Firestore             dữ liệu chính
Google Sheets               bản sao lời chúc để dễ đọc
```

Trình duyệt không ghi trực tiếp vào Firestore hoặc Google Sheets. Service account chỉ tồn tại trong Cloudflare Secrets.

## 1. Chuẩn bị Firebase

1. Mở Firebase Console của project.
2. Tạo Cloud Firestore ở Standard/Native mode.
3. Chọn region gần người xem, ví dụ `asia-southeast1` nếu có sẵn trong màn hình tạo database.
4. Trong Project settings → Service accounts, tạo một private key JSON.
5. Lấy ba giá trị:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
6. Xác nhận project ID trong `.firebaserc`, sau đó deploy [firebase.rules](./firebase.rules) bằng `npx firebase-tools deploy --only firestore:rules`. Rules hiện chặn toàn bộ truy cập trực tiếp từ browser; Worker được cấp quyền qua IAM.

Không đưa file JSON service account vào repository.

## 2. Chuẩn bị Google Sheets

1. Tạo spreadsheet và ba sheet tên `Wishes`, `Song Suggestions`, `Photo Index`.
2. Tạo hàng tiêu đề:

```text
Created At | Name | Message | Source | Guest Slug | Wish ID | Status
```

3. Chia sẻ spreadsheet cho email trong `GOOGLE_SERVICE_ACCOUNT_EMAIL` với quyền Editor.
4. Lấy ID nằm giữa `/d/` và `/edit` trong URL → `GOOGLE_SHEETS_ID`.
5. Bật Google Sheets API trong Google Cloud project tương ứng.

Hai tab bổ sung dùng các header:

```text
Song Suggestions: Created At | Title | Artist | Reason | Guest Slug | Suggestion ID | Status
Photo Index: Created At | Context | Sender | Caption | Guest Slug | Photo ID | Status | Object Key | Content Type | Size
```

Firestore luôn được ghi trước. Nếu Sheets lỗi, document giữ `backupStatus: pending` để retry mà không làm mất lời chúc.

## 3. Cấu hình Cloudflare Worker

Worker hiện tại là `my-wedding-project` và dùng Static Assets. `wrangler.toml` chỉ đưa `/api/*` và `/invite/*` qua Worker code; HTML, CSS, JavaScript, ảnh và audio tiếp tục được phục vụ trực tiếp từ Assets.

Nếu dùng Git integration:

- Production branch: `main`.
- Build command: để trống hoặc `npm run check`.
- Deploy command: `npm run deploy`.
- Worker name: `my-wedding-project`.

Thêm Variables and Secrets cho cả Production và Preview:

```text
FIREBASE_PROJECT_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  (Secret)
GOOGLE_SHEETS_ID
BACKUP_CRON_SECRET                  (Secret)
ADMIN_API_SECRET                    (Secret)
RATE_LIMIT_SALT                     (Secret)
```

Các biến thường đã có mặc định trong `wrangler.toml`:

```text
FIREBASE_DATABASE_ID=(default)
WISHES_COLLECTION=wishes
GUESTS_COLLECTION=guests
GOOGLE_SHEETS_RANGE=Wishes!A:G
MAX_WISHES=40
SONG_SUGGESTIONS_COLLECTION=songSuggestions
PHOTOS_COLLECTION=photoSubmissions
GOOGLE_SONGS_RANGE=Song Suggestions!A:G
GOOGLE_PHOTOS_RANGE=Photo Index!A:J
GOOGLE_GUESTS_RANGE=Guests!A:I
PUBLIC_SITE_URL=https://ten-mien-cua-ban
GUEST_SYNC_ENABLED=true
WEDDING_DAY_START=2026-10-20T00:00:00+07:00
WEDDING_DAY_END=2026-10-21T06:00:00+07:00
```

## 3.1. R2 và KV

- R2 bucket: `my-wedding-photos`, binding `PHOTO_BUCKET`.
- KV namespace: binding `RATE_LIMIT`.
- Ảnh story được lưu `pending` và chỉ xuất hiện sau khi duyệt.
- Ảnh `wedding-day` chỉ nhận từ slug khách đang hoạt động, đúng khung giờ cấu hình; ảnh hợp lệ được publish ngay.
- Mỗi ảnh được nén phía client, Worker chỉ nhận JPG/PNG/WebP tối đa 2,5 MB và kiểm tra chữ ký tệp.

Health check sau deploy:

```text
GET https://ten-mien-cua-ban/api/health
```

## 4. Rate limit và Turnstile

Rate limit là tùy chọn nhưng nên bật:

1. Tạo Workers KV namespace.
2. Trong Worker `my-wedding-project` → Settings → Bindings, bind namespace với tên `RATE_LIMIT`.
3. Worker giới hạn mỗi IP tối đa 5 lời chúc trong 10 phút.

Turnstile cũng là tùy chọn. Khi dùng, phải cấu hình đồng thời:

```text
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY  (Secret)
```

Frontend sẽ tự tải widget khi API trả về site key. Không cấu hình riêng một trong hai khóa.

## 5. Tạo thiệp riêng cho khách từ Google Sheets

Worker tự tạo tab `Guests` nếu chưa có. Nếu tạo thủ công, dòng đầu cần đúng thứ tự:

```text
guest_id | name | group | delivery | slug | invite_url | status | created_at | updated_at
```

Mỗi khách nằm trên một dòng. Chỉ cần nhập `name`, `group`, `delivery` và `status`:

```text
             | Minh | friend | online   | | | active   | |
             | Huy  | anh    | online   | | | active   | |
             | Lan  | chi    | online   | | | active   | |
             | An   | em     | online   | | | active   | |
             | Bác  | anh    | physical | | | active   | |
```

- `group` nhận `friend`, `anh`, `chi`, `em`. Nhóm `em` dùng cho cả nam và nữ.
- `delivery=online`: Worker tạo `guest_id`, slug ngẫu nhiên, URL và document Firestore.
- `delivery=physical`: không tạo URL; nếu đổi từ online sang physical thì URL cũ bị vô hiệu hóa.
- `status=disabled`: giữ dữ liệu nhưng URL không mở được.
- Cron chạy mỗi 10 phút. Dòng không đổi sẽ không ghi lại Firestore, giúp tiết kiệm quota.

Có thể đồng bộ ngay mà không chờ cron:

```bash
curl -X POST "https://ten-mien-cua-ban/api/admin/sync-guests" \
  -H "Authorization: Bearer ADMIN_API_SECRET"
```

Worker sẽ ghi `guest_id`, `slug`, `invite_url`, `created_at` và `updated_at` trở lại đúng dòng trong Sheet.

Document ID trong collection `guests` chính là slug bí mật. Slug luôn có phần ngẫu nhiên, không dùng tên đơn thuần:

Document ID trong collection `guests` chính là slug bí mật. Nên dùng slug có phần ngẫu nhiên, không dùng tên đơn thuần:

```text
minh-anh-7k3p9
gia-dinh-co-lan-p4m8x2
```

Schema document được tạo tự động:

```json
{
  "guestId": "G-ab12cd34ef",
  "displayName": "Anh Minh",
  "salutation": "anh Minh",
  "group": "anh",
  "delivery": "online",
  "partySize": 1,
  "active": true
}
```

Endpoint JSON cũ vẫn được giữ để tương thích và hỗ trợ tối đa 20 khách mỗi request:

```bash
curl -X POST "https://ten-mien-cua-ban/api/admin/guests" \
  -H "Authorization: Bearer ADMIN_API_SECRET" \
  -H "Content-Type: application/json" \
  --data '{"guests":[{"slug":"anh-minh-7k3p9","name":"Minh","group":"anh","delivery":"online"}]}'
```

Link gửi cho khách:

```text
https://ten-mien-cua-ban/invite/minh-anh-7k3p9
```

Cloudflare lấy dữ liệu khách, inject vào `invitation.html` và đặt `noindex`, `no-store`. Slug sai hoặc khách có `active: false` sẽ không mở được thiệp.

Import danh sách JSON bằng script (file thật `guests.json` đã nằm trong `.gitignore`):

```bash
cp guests.example.json guests.json
npm run guests:import -- guests.json
```

Script đọc `ADMIN_API_SECRET` từ `.env.production`, không in secret và chỉ in các URL thiệp đã tạo.

## 5.1. Duyệt bài hát và ảnh story

Nội dung mới mặc định là `pending`. Có thể publish/reject bằng endpoint admin:

```bash
curl -X POST "https://ten-mien-cua-ban/api/admin/moderate" \
  -H "Authorization: Bearer ADMIN_API_SECRET" \
  -H "Content-Type: application/json" \
  --data '{"type":"song","id":"SUBMISSION_ID","status":"published"}'
```

`type` nhận `song` hoặc `photo`; `status` nhận `published` hoặc `rejected`. Reject ảnh sẽ xóa object R2 tương ứng.

## 6. Retry Google Sheets

Mỗi lời chúc mới tự thử đồng bộ Sheets. Có thể retry thủ công toàn bộ item pending:

```bash
curl -X POST "https://ten-mien-cua-ban/api/admin/retry-backups" \
  -H "Authorization: Bearer BACKUP_CRON_SECRET"
```

Endpoint này cũng có thể được gọi định kỳ bằng một Cron Trigger riêng.

## 7. Chạy local

```bash
cp .dev.vars.example .dev.vars
npm install
npm run dev
```

Phải chạy qua `wrangler dev`; mở bằng static file server sẽ không có `/api`.

Chạy test không cần Firebase thật:

```bash
npm run check
```
