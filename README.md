# MongoDB Query Studio

Đây là một dự án thực hành hệ quản trị cơ sở dữ liệu NoSQL, cung cấp giao diện Web trực quan (HTML, CSS thuần, Javascript) và Backend API (Flask) để kết nối và thao tác dễ dàng trên cơ sở dữ liệu MongoDB Atlas. Dự án là một ứng dụng chat Real-time (`ChatRealtimeDB`) với 7 collections: users, friendships, conversations, conversation_members, messages, attachments, và notifications.

## Cấu trúc thư mục

- `frontend/`: Chứa giao diện website (Web UI) hỗ trợ 2 mode:
  - **UI Mode**: Chọn collection, operation, và viết query JSON dễ dàng
  - **Manual Mode**: Viết truy vấn raw MongoDB Shell (Mongosh format)
- `backend/`: Chứa hệ thống API bằng Flask làm máy chủ trung gian thực hiện các truy vấn PyMongo một cách an toàn.

---

## Hướng dẫn cài đặt và khởi chạy

### Bước 1: Cài đặt Backend

1. Mở Terminal, đi tới thư mục project:
   ```bash
   cd d:\Classes\HCSQTDL-NoSQL
   ```

2. Kích hoạt virtual environment:
   ```bash
   .\venv\Scripts\Activate.ps1
   ```

3. Cài đặt các thư viện Python:
   ```bash
   pip install -r requirements.txt
   ```

4. Khai báo chuỗi kết nối Database. Mở file `.env` ở trong thư mục root và điền link MongoDB Atlas:
   ```env
   MONGO_URI=mongodb+srv://HienHoang:triplehptit2005@cluster0.mkefqur.mongodb.net/ChatRealtimeDB?retryWrites=true&w=majority
   ```

### Bước 2: Khởi chạy API Server

Từ thư mục `backend`:
```bash
cd backend
python main.py
```

Server lúc này sẽ bật tại `http://127.0.0.1:8000` và hiển thị:
```
* Running on http://127.0.0.1:8000
```

### Bước 3: Mở Giao Diện Web (Frontend)

- Mở file `frontend/index.html` bằng trình duyệt web (hoặc dùng **Live Server** của VSCode)
- Khi load trang, hệ thống sẽ tự động kết nối Backend tại `http://127.0.0.1:8000`
- Danh sách Collections sẽ được hiển thị tự động từ MongoDB

---

## 📋 Cấu trúc Collections

### 1. Collection: users
Lưu thông tin người dùng của hệ thống chat.
- **username**: string (Unique) - Tên đăng nhập
- **email**: string (Unique) - Địa chỉ email
- **password_hash**: string - Mật khẩu đã mã hóa
- **display_name**: string - Tên hiển thị
- **avatar_url**: string | null - Đường dẫn ảnh đại diện
- **bio**: string | null - Tiểu sử cá nhân
- **last_seen**: date - Lần truy cập cuối cùng
- **device_tokens**: array - Token thiết bị cho push notifications
- **is_active**: boolean - Trạng thái hoạt động
- **role**: string (enum: "user", "admin") - Vai trò
- **created_at**: date - Ngày tạo tài khoản

### 2. Collection: friendships
Quản lý mối quan hệ bạn bè giữa các người dùng.
- **requester_id**: ObjectId - ID người gửi yêu cầu kết bạn
- **recipient_id**: ObjectId - ID người nhận yêu cầu
- **status**: string (enum: "pending", "accepted", "blocked") - Trạng thái quan hệ
- **created_at**: date - Ngày gửi yêu cầu
- **updated_at**: date - Ngày cập nhật trạng thái

### 3. Collection: conversations
Lưu thông tin các cuộc hội thoại (direct hoặc group chat).
- **type**: string (enum: "direct", "group") - Loại cuộc hội thoại
- **name**: string | null - Tên cuộc trò chuyện (nếu là group)
- **avatar_url**: string | null - Ảnh đại diện cuộc trò chuyện
- **member_ids**: array (ObjectId) - Danh sách ID thành viên
- **last_messages**: array - Mảng 3 tin nhắn mới nhất
- **created_by**: ObjectId - ID người tạo cuộc hội thoại
- **created_at**: date - Ngày tạo
- **updated_at**: date - Ngày cập nhật cuối cùng

### 4. Collection: conversation_members
Quản lý vai trò và trạng thái của mỗi thành viên trong cuộc hội thoại.
- **conversation_id**: ObjectId - ID cuộc hội thoại
- **user_id**: ObjectId - ID người dùng
- **role**: string (enum: "owner", "admin", "member") - Vai trò trong nhóm
- **is_muted**: boolean - Có tắt thông báo của cuộc hội thoại này không
- **last_read_messages_id**: ObjectId | null - ID tin nhắn cuối cùng mà thành viên đã đọc
- **joined_at**: date - Ngày tham gia nhóm

### 5. Collection: messages
Lưu toàn bộ tin nhắn trong hệ thống.
- **conversation_id**: ObjectId - ID cuộc hội thoại chứa tin nhắn
- **sender_id**: ObjectId - ID người gửi
- **type**: string (enum: "text", "image", "file", "audio", "video", "system") - Loại tin nhắn
- **content**: string | null - Nội dung tin nhắn
- **attachment_id**: ObjectId | null - ID tệp đính kèm
- **reply_to_id**: ObjectId | null - ID tin nhắn được trả lời
- **reactions**: array - Mảng reactions (emoji, người phản ứng)
- **is_recalled**: boolean - Tin nhắn đã bị thu hồi
- **created_at**: date - Ngày giờ gửi tin nhắn

### 6. Collection: attachments
Quản lý các tệp tin được upload trong tin nhắn.
- **uploader_id**: ObjectId - ID người upload
- **original_name**: string - Tên gốc tệp tin
- **mime_type**: string - Loại MIME (image/jpeg, application/pdf, ...)
- **size_bytes**: number - Dung lượng tệp (bytes)
- **storage_path**: string - Đường dẫn lưu trữ trên server/cloud
- **created_at**: date - Ngày upload

### 7. Collection: notifications
Lưu thông báo cho người dùng.
- **recipient_id**: ObjectId - ID người nhận thông báo
- **type**: string (enum: "new_message", "friend_request", "group_invite", "mention") - Loại thông báo
- **title**: string - Tiêu đề thông báo
- **body**: string - Nội dung thông báo
- **reference_id**: ObjectId | null - ID của tài nguyên liên quan
- **is_read**: boolean - Đã đọc thông báo chưa
- **created_at**: date - Ngày tạo thông báo (TTL: 30 ngày)

---

## � Index Strategy

Các chỉ mục được tạo để tối ưu hóa hiệu suất truy vấn và đảm bảo tính duy nhất của dữ liệu:

### 1. Collection: users
```javascript
// Unique index cho username
db.users.createIndex({ username: 1 }, { unique: true, name: "idx_users_username" });

// Unique index cho email
db.users.createIndex({ email: 1 }, { unique: true, name: "idx_users_email" });

// Text index cho tìm kiếm display_name
db.users.createIndex({ display_name: "text" }, { name: "idx_users_displayname_text" });
```

### 2. Collection: friendships
```javascript
// Unique compound index (requester_id, recipient_id) - tránh trùng lặp quan hệ
db.friendships.createIndex({ requester_id: 1, recipient_id: 1 }, { unique: true, name: "idx_friendships_pair" });

// Index cho tìm friend requests theo recipient_id và status
db.friendships.createIndex({ recipient_id: 1, status: 1 }, { name: "idx_friendships_recipient_status" });
```

### 3. Collection: conversations
```javascript
// Index cho tìm cuộc hội thoại theo thành viên
db.conversations.createIndex({ member_ids: 1 }, { name: "idx_conversations_members" });

// Index cho sắp xếp theo thời gian cập nhật gần đây
db.conversations.createIndex({ updated_at: -1 }, { name: "idx_conversations_updated" });

// Compound index cho tìm group chat theo type và members
db.conversations.createIndex({ type: 1, member_ids: 1 }, { name: "idx_conversations_type_members_br2" });
```

### 4. Collection: conversation_members
```javascript
// Unique compound index (user_id, conversation_id) - tránh thành viên trùng lặp
db.conversation_members.createIndex({ user_id: 1, conversation_id: 1 }, { unique: true, name: "idx_convmembers_user_conv" });

// Index cho tìm tất cả thành viên trong cuộc hội thoại
db.conversation_members.createIndex({ conversation_id: 1 }, { name: "idx_convmembers_conv" });
```

### 5. Collection: messages
```javascript
// Compound index cho lấy tin nhắn theo cuộc hội thoại, sắp xếp theo thời gian
db.messages.createIndex({ conversation_id: 1, created_at: -1 }, { name: "idx_messages_conv_time" });

// Index cho tìm tin nhắn theo người gửi
db.messages.createIndex({ sender_id: 1 }, { name: "idx_messages_sender" });

// Text index cho tìm kiếm nội dung tin nhắn
db.messages.createIndex({ content: "text" }, { name: "idx_messages_content_text" });
```

### 6. Collection: attachments
```javascript
// Index cho tìm file upload của một người dùng
db.attachments.createIndex({ uploader_id: 1 }, { name: "idx_attachments_uploader" });
```

### 7. Collection: notifications
```javascript
// Compound index cho tìm thông báo của một người dùng, chưa đọc, mới nhất trước
db.notifications.createIndex({ recipient_id: 1, is_read: 1, created_at: -1 }, { name: "idx_notifications_recipient" });

// TTL index - Xóa thông báo sau 30 ngày (2592000 giây)
db.notifications.createIndex({ created_at: 1 }, { expireAfterSeconds: 2592000, name: "idx_notifications_ttl" });
```

---

## �📝 Lưu ý sử dụng truy vấn

Giao diện yêu cầu bạn viết bằng format `JSON` chuẩn (Các key cần có dấu ngoặc kép đôi `" "`).

**1. Đối với thao tác Find / Insert / Delete**
Chỉ cần truyền object json đại diện cho giá trị bạn muốn filter hoặc chèn. VD:
```json
{
  "type": "group"
}
```

**2. Đối với thao tác Update**
Để hệ thống hiểu được đâu là điều kiện tìm kiếm và đâu là nội dung muốn sửa, bạn bắt buộc viết cấu trúc gồm `filter` và `update`. Ví dụ:
```json
{
  "filter": { "username": "user_1" },
  "update": { "$set": { "is_active": false } }
}
```
