# MongoDB Query Studio

Đây là một dự án thực hành hệ quản trị cơ sở dữ liệu NoSQL, cung cấp giao diện Web trực quan (HTML, CSS thuần, Javascript) và Backend API (FastAPI) để kết nối và thao tác dễ dàng trên cơ sở dữ liệu MongoDB Atlas. Dự án là một ứng dụng chat Real-time (`ChatRealtimeDB`) với 7 collections: users, friendships, conversations, conversation_members, messages, attachments, và notifications.

## Cấu trúc thư mục

- `frontend/`: Chứa giao diện website (Web UI) hỗ trợ việc chọn collections và viết truy vấn JSON để thao tác CSDL.
- `backend/`: Chứa hệ thống API bằng FastAPI làm máy chủ trung gian thực hiện các truy vấn PyMongo một cách an toàn.

---

## Hướng dẫn cài đặt và khởi chạy

### Bước 1: Thiết lập Backend

1. Mở Terminal, đi tới thư mục `backend/`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện Python dùng cho dự án:
   ```bash
   pip install -r requirements.txt
   ```
3. Khai báo chuỗi kết nối Database. Mở file `.env` ở trong thư mục `backend` và điền link MongoDB Atlas của bạn vào:
   ```env
   MONGO_URI=mongodb+srv://HienHoang:triplehptit2005@cluster0.mkefqur.mongodb.net/
   ```

### Bước 2: Khởi chạy API Server
Sau khi cấu hình xong, chạy API cục bộ với `uvicorn`:
```bash
uvicorn main:app --reload
```
Server lúc này đã bật và lắng nghe yêu cầu tại `http://localhost:8000`.

### Bước 3: Mở Giao Diện Web (Frontend)
Bạn chỉ cần mở trực tiếp file `frontend/index.html` bằng trình duyệt web. Khuyến khích sử dụng tiện ích **Live Server** của VSCode để tải trang tốt hơn.

- Khi load trang, hệ thống sẽ gọi ngầm vào Backend. 
- Các thông tin DB sẽ được giấu đi và hệ thống tự động đổ danh sách các Collections thật từ MongoDB của bạn thả vào menu chọn.

---

## � Cấu trúc Collections

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

## 📝 Lưu ý sử dụng truy vấn

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
