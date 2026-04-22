# MongoDB Query Studio

Đây là một dự án thực hành hệ quản trị cơ sở dữ liệu NoSQL, cung cấp giao diện Web trực quan (HTML, CSS thuần, Javascript) và Backend API (FastAPI) để kết nối và thao tác dễ dàng trên cơ sở dữ liệu MongoDB Atlas. Dự án cũng bao gồm script khởi tạo Database với Schema Validation chặt chẽ cho một ứng dụng chat (`ChatRealTimeDB`).

## Cấu trúc thư mục

- `frontend/`: Chứa giao diện website (Web UI) hỗ trợ việc chọn collections và viết truy vấn JSON để thao tác CSDL.
- `backend/`: Chứa hệ thống API bằng FastAPI làm máy chủ trung gian thực hiện các truy vấn PyMongo một cách an toàn.
- `init_db.js`: Script dành cho MongoDB Shell dùng để tạo sẵn các Collections, cấu hình Schema Validator và chèn dữ liệu mẫu cho hệ thống chat.

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

## 📝 Lưu ý sử dụng truy vấn

Giao diện yêu cầu bạn viết bằng format `JSON` chuẩn (Các key cần có dấu ngoặc kép đôi `" "`).

**1. Đối với thao tác Find / Insert / Delete**
Chỉ cần truyền object json đại diện cho giá trị bạn muốn filter hoặc chèn. VD:
```json
{
  "type": "Direct"
}
```

**2. Đối với thao tác Update**
Để hệ thống hiểu được đâu là điều kiện tìm kiếm và đâu là nội dung muốn sửa, bạn bắt buộc viết cấu trúc gồm `filter` và `update`. Ví dụ:
```json
{
  "filter": { "userName": "thanh_tung_99" },
  "update": { "$set": { "isOnline": false } }
}
```
