db = db.getSiblingDB("ChatRealTimeDB");

// Drop existing collections to make the script idempotent and prevent "Collection already exists" errors
db.Users.drop();
db.Conversations.drop();
db.Messages.drop();
db.Attachments.drop();
db.Notifications.drop();

db.createCollection("Users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userName", "email", "password", "lastActive", "isOnline"],
      properties: {
        userName: { bsonType: "string" },
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        avatarUrl: { bsonType: ["string", "null"] },
        blockedUsers: { bsonType: "array", items: { bsonType: "objectId" } },
        lastActive: { bsonType: "date" },
        isOnline: { bsonType: "bool" }
      }
    }
  }
})

db.createCollection("Conversations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type", "participants", "updatedAt"],
      properties: {
        type: { enum: ["Direct", "Group"] },
        participants: { bsonType: "array", items: { bsonType: "objectId" } },
        groupName: { bsonType: ["string", "null"] },
        admins: { bsonType: "array", items: { bsonType: "objectId" } },
        lastMessageId: { bsonType: "objectId" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
})

db.createCollection("Messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversationId", "senderId", "messageType", "createdAt", "isHidden"],
      properties: {
        conversationId: { bsonType: "objectId" },
        senderId: { bsonType: "objectId" },
        messageType: { enum: ["Text", "Image", "File", "System"] },
        content: { bsonType: "string" },
        readBy: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["userId", "readAt"],
            properties: {
              userId: { bsonType: "objectId" },
              readAt: { bsonType: "date" }
            }
          }
        },
        createdAt: { bsonType: "date" },
        isHidden: { bsonType: "bool" }
      }
    }
  }
})

db.createCollection("Attachments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["messageId", "fileName", "fileType", "fileSize", "fileUrl"],
      properties: {
        messageId: { bsonType: "objectId" },
        fileName: { bsonType: "string" },
        fileType: { bsonType: "string" },
        fileSize: { bsonType: "number" },
        fileUrl: { bsonType: "string" }
      }
    }
  }
})

db.createCollection("Notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "title", "body", "isDelivered", "createdAt"],
      properties: {
        userId: { bsonType: "objectId" },
        title: { bsonType: "string" },
        body: { bsonType: "string" },
        isDelivered: { bsonType: "bool" },
        createdAt: { bsonType: "date" }
      }
    }
  }
})


db.Users.createIndex({ userName: 1 }, { unique: true })
db.Users.createIndex({ email: 1 }, { unique: true })
db.Conversations.createIndex({ participants: 1, updatedAt: -1 })
db.Messages.createIndex({ conversationId: 1, createdAt: 1 })
db.Messages.createIndex({ senderId: 1 })
db.Attachments.createIndex({ messageId: 1 })
db.Notifications.createIndex({ userId: 1, createdAt: -1 })


// Khởi tạo 20 bản ghi người dùng thực tế
db.Users.insertMany([
  // --- NHÓM QUẢN LÝ DỰ ÁN & C-LEVEL ---
  { 
    _id: ObjectId("65c000000000000000000001"), 
    userName: "kien_ceo", 
    email: "kien.tran@techcorp.vn", 
    password: "$2b$10$hashedpasswordCEO12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/kien_ceo.jpg", 
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c000000000000000000002"), 
    userName: "binh_cto", 
    email: "binh.le@techcorp.vn", 
    password: "$2b$10$hashedpasswordCTO12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/binh_cto.jpg", 
    blockedUsers: [], 
    lastActive: new Date("2026-04-14T08:15:00Z"), 
    isOnline: false 
  },
  { 
    _id: ObjectId("65c000000000000000000003"), 
    userName: "lan_pm", 
    email: "lan.nguyen@techcorp.vn", 
    password: "$2b$10$hashedpasswordPM123456789", 
    avatarUrl: "https://s3.cloud.com/avatars/lan_pm.png", 
    blockedUsers: [ObjectId("65c000000000000000000014")], // PM chặn tài khoản spam
    lastActive: new Date(), 
    isOnline: true 
  },

  // --- NHÓM KỸ THUẬT PHẦN MỀM ---
  { 
    _id: ObjectId("65c000000000000000000004"), 
    userName: "hoang_be", 
    email: "hoang.backend@techcorp.vn", 
    password: "$2b$10$hashedpasswordBE123456789", 
    avatarUrl: "https://s3.cloud.com/avatars/hoang_be.jpg", 
    blockedUsers: [], 
    lastActive: new Date("2026-04-13T23:30:00Z"), 
    isOnline: false 
  },
  { 
    _id: ObjectId("65c000000000000000000005"), 
    userName: "tung_node", 
    email: "tung.nodejs@techcorp.vn", 
    password: "$2b$10$hashedpasswordNODE1234567", 
    avatarUrl: null, // Test UI hiển thị ảnh mặc định khi avatarUrl null
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c000000000000000000006"), 
    userName: "mai_fe", 
    email: "mai.react@techcorp.vn", 
    password: "$2b$10$hashedpasswordFE123456789", 
    avatarUrl: "https://s3.cloud.com/avatars/mai_fe.png", 
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c000000000000000000007"), 
    userName: "quang_vue", 
    email: "quang.ui@techcorp.vn", 
    password: "$2b$10$hashedpasswordVUE12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/quang_fe.jpg", 
    blockedUsers: [ObjectId("65c000000000000000000014")], 
    lastActive: new Date("2026-04-13T18:00:00Z"), 
    isOnline: false 
  },
  { 
    _id: ObjectId("65c000000000000000000008"), 
    userName: "trang_flutter", 
    email: "trang.mobile@techcorp.vn", 
    password: "$2b$10$hashedpasswordMOB12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/trang_mobile.jpg", 
    blockedUsers: [], 
    lastActive: new Date("2026-04-14T09:45:00Z"), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c000000000000000000009"), 
    userName: "linh_qa", 
    email: "linh.tester@techcorp.vn", 
    password: "$2b$10$hashedpasswordQA123456789", 
    avatarUrl: "https://s3.cloud.com/avatars/linh_qa.png", 
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },

  // --- NHÓM AI & DATA ENGINEER ---
  { 
    _id: ObjectId("65c00000000000000000000a"), 
    userName: "kieulinh_ts", 
    email: "kieulinh.ts@ptit.edu.vn", 
    password: "$2b$10$hashedpasswordAI123456789", 
    avatarUrl: "https://s3.cloud.com/avatars/linh_ts.jpg", 
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c00000000000000000000b"), 
    userName: "duc_de", 
    email: "duc.dataeng@techcorp.vn", 
    password: "$2b$10$hashedpasswordDE123456789", 
    avatarUrl: "https://s3.cloud.com/avatars/duc_de.jpg", 
    blockedUsers: [], 
    lastActive: new Date("2026-04-12T09:00:00Z"), 
    isOnline: false 
  },
  { 
    _id: ObjectId("65c00000000000000000000c"), 
    userName: "minh_llm", 
    email: "minh.ai@techcorp.vn", 
    password: "$2b$10$hashedpasswordLLM12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/minh_llm.png", 
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },

  // --- NHÓM VẬN HÀNH (HR, MARKETING, SALES) ---
  { 
    _id: ObjectId("65c00000000000000000000d"), 
    userName: "huong_hr", 
    email: "huong.hr@techcorp.vn", 
    password: "$2b$10$hashedpasswordHR123456789", 
    avatarUrl: "https://s3.cloud.com/avatars/huong_hr.jpg", 
    blockedUsers: [ObjectId("65c000000000000000000014")], // HR thường xuyên block spammer
    lastActive: new Date("2026-04-13T17:30:00Z"), 
    isOnline: false 
  },
  { 
    _id: ObjectId("65c00000000000000000000e"), 
    userName: "phuong_mkt", 
    email: "phuong.marketing@techcorp.vn", 
    password: "$2b$10$hashedpasswordMKT12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/phuong_mkt.jpg", 
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c00000000000000000000f"), 
    userName: "dat_sales", 
    email: "dat.b2b@techcorp.vn", 
    password: "$2b$10$hashedpasswordSAL12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/dat_sales.jpg", 
    blockedUsers: [], 
    lastActive: new Date("2026-04-14T02:00:00Z"), 
    isOnline: false 
  },

  // --- NHÓM ĐỐI TÁC & EXTERNAL USERS ---
  { 
    _id: ObjectId("65c000000000000000000010"), 
    userName: "hieu_investor", 
    email: "hieu.vc@capital.com", 
    password: "$2b$10$hashedpasswordINV12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/hieu_vc.png", 
    blockedUsers: [], 
    lastActive: new Date("2026-04-10T10:00:00Z"), 
    isOnline: false 
  },
  { 
    _id: ObjectId("65c000000000000000000011"), 
    userName: "cuong_client", 
    email: "cuong.do@partner-corp.vn", 
    password: "$2b$10$hashedpasswordCLI12345678", 
    avatarUrl: null, 
    blockedUsers: [], 
    lastActive: new Date("2026-04-14T10:00:00Z"), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c000000000000000000012"), 
    userName: "ngoc_agency", 
    email: "ngoc.media@agency.vn", 
    password: "$2b$10$hashedpasswordAGE12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/ngoc.jpg", 
    blockedUsers: [], 
    lastActive: new Date("2026-04-11T14:20:00Z"), 
    isOnline: false 
  },

  // --- TÀI KHOẢN HỆ THỐNG & BOT / SPAMMER ---
  { 
    _id: ObjectId("65c000000000000000000013"), 
    userName: "system_bot", 
    email: "noreply@techcorp.vn", 
    password: "$2b$10$hashedpasswordBOT12345678", 
    avatarUrl: "https://s3.cloud.com/avatars/bot_icon.png", 
    blockedUsers: [], 
    lastActive: new Date(), 
    isOnline: true 
  },
  { 
    _id: ObjectId("65c000000000000000000014"), 
    userName: "spammer_01", 
    email: "crypto.win.free@spammail.com", 
    password: "$2b$10$hashedpasswordSPM12345678", 
    avatarUrl: "https://malicious.com/spam.png", 
    blockedUsers: [], 
    lastActive: new Date("2026-03-01T00:00:00Z"), 
    isOnline: false 
  }
]);


// Khởi tạo các không gian trò chuyện
db.Conversations.insertMany([
  // ==========================================
  // 1. CÁC HỘI THOẠI NHÓM (TYPE: "Group")
  // ==========================================
  
  {
    // Nhóm: Ban Giám Đốc & Quản lý
    _id: ObjectId("65c100000000000000000001"),
    type: "Group",
    participants: [
      ObjectId("65c000000000000000000001"), // kien_ceo
      ObjectId("65c000000000000000000002"), // binh_cto
      ObjectId("65c000000000000000000003")  // lan_pm
    ],
    groupName: "BOD & Management",
    admins: [ObjectId("65c000000000000000000001")], // kien_ceo làm admin
    lastMessageId: ObjectId("65c200000000000000000001"),
    updatedAt: new Date("2026-04-14T10:30:00Z")
  },
  {
    // Nhóm: Dự án LLM Chatbot (Team Tech + AI)
    _id: ObjectId("65c100000000000000000002"),
    type: "Group",
    participants: [
      ObjectId("65c000000000000000000002"), // binh_cto
      ObjectId("65c000000000000000000003"), // lan_pm
      ObjectId("65c000000000000000000004"), // hoang_be
      ObjectId("65c000000000000000000006"), // mai_fe
      ObjectId("65c00000000000000000000a"), // kieulinh_ts
      ObjectId("65c00000000000000000000c")  // minh_llm
    ],
    groupName: "Dự án: RAG & LLM Chatbot",
    admins: [ObjectId("65c000000000000000000002"), ObjectId("65c000000000000000000003")], // CTO và PM làm admin
    lastMessageId: ObjectId("65c200000000000000000002"),
    updatedAt: new Date("2026-04-14T09:15:00Z")
  },
  {
    // Nhóm: Kênh hỗ trợ Khách hàng Doanh nghiệp
    _id: ObjectId("65c100000000000000000003"),
    type: "Group",
    participants: [
      ObjectId("65c000000000000000000003"), // lan_pm
      ObjectId("65c00000000000000000000f"), // dat_sales
      ObjectId("65c000000000000000000011")  // cuong_client (Khách hàng)
    ],
    groupName: "Support: Partner-Corp VN",
    admins: [ObjectId("65c00000000000000000000f")], // Sales làm admin
    lastMessageId: ObjectId("65c200000000000000000003"),
    updatedAt: new Date("2026-04-13T16:45:00Z")
  },
  {
    // Nhóm: Công ty (General) - Ít tương tác gần đây
    _id: ObjectId("65c100000000000000000004"),
    type: "Group",
    participants: [
      ObjectId("65c000000000000000000001"), ObjectId("65c000000000000000000002"),
      ObjectId("65c000000000000000000003"), ObjectId("65c00000000000000000000d")
      // Lược bớt để script ngắn gọn, giả lập nhóm thông báo chung
    ],
    groupName: "Company General Announcement",
    admins: [ObjectId("65c00000000000000000000d")], // HR làm admin
    lastMessageId: ObjectId("65c200000000000000000004"),
    updatedAt: new Date("2026-04-01T08:00:00Z")
  },

  // ==========================================
  // 2. CÁC HỘI THOẠI CÁ NHÂN (TYPE: "Direct")
  // ==========================================

  {
    // Chat 1-1: PM giao việc cho Backend
    _id: ObjectId("65c100000000000000000005"),
    type: "Direct",
    participants: [
      ObjectId("65c000000000000000000003"), // lan_pm
      ObjectId("65c000000000000000000005")  // tung_node
    ],
    groupName: null, admins: [], // Direct thì null và empty array
    lastMessageId: ObjectId("65c200000000000000000005"),
    updatedAt: new Date("2026-04-14T11:00:00Z")
  },
  {
    // Chat 1-1: Team AI trao đổi thuật toán
    _id: ObjectId("65c00000000000000000000a"), // kieulinh_ts
    type: "Direct",
    participants: [
      ObjectId("65c00000000000000000000a"), // kieulinh_ts
      ObjectId("65c00000000000000000000c")  // minh_llm
    ],
    groupName: null, admins: [],
    lastMessageId: ObjectId("65c200000000000000000006"),
    updatedAt: new Date("2026-04-14T08:50:00Z")
  },
  {
    // Chat 1-1: Trao đổi Marketing với Agency ngoài
    _id: ObjectId("65c100000000000000000007"),
    type: "Direct",
    participants: [
      ObjectId("65c00000000000000000000e"), // phuong_mkt
      ObjectId("65c000000000000000000012")  // ngoc_agency
    ],
    groupName: null, admins: [],
    lastMessageId: ObjectId("65c200000000000000000007"),
    updatedAt: new Date("2026-04-11T14:30:00Z")
  },
  {
    // Chat 1-1: Bot Hệ Thống gửi thông báo cho CEO
    _id: ObjectId("65c100000000000000000008"),
    type: "Direct",
    participants: [
      ObjectId("65c000000000000000000013"), // system_bot
      ObjectId("65c000000000000000000001")  // kien_ceo
    ],
    groupName: null, admins: [],
    lastMessageId: ObjectId("65c200000000000000000008"),
    updatedAt: new Date("2026-04-14T12:00:00Z")
  },
  {
    // Chat 1-1: BỊ CHẶN - Spammer nhắn tin lừa đảo cho HR (Để test tính năng block)
    _id: ObjectId("65c100000000000000000009"),
    type: "Direct",
    participants: [
      ObjectId("65c000000000000000000014"), // spammer_01
      ObjectId("65c00000000000000000000d")  // huong_hr (người này đã block spammer trong collection Users)
    ],
    groupName: null, admins: [],
    lastMessageId: ObjectId("65c200000000000000000009"),
    updatedAt: new Date("2026-03-01T00:05:00Z") // Xảy ra từ tháng trước, sau đó bị chặn
  }
]);


db.Messages.insertMany([
  // =======================================================================
  // BOX 1: Group BOD & Management (conversationId: 65c1...01)
  // Tham gia: kien_ceo, binh_cto, lan_pm
  // =======================================================================
  {
    _id: ObjectId("65c200000000000000000010"), conversationId: ObjectId("65c100000000000000000001"),
    senderId: ObjectId("65c000000000000000000001"), // kien_ceo
    messageType: "System", content: "kien_ceo đã tạo nhóm BOD & Management",
    readBy: [ { userId: ObjectId("65c000000000000000000002"), readAt: new Date("2026-04-14T10:05:00Z") } ],
    createdAt: new Date("2026-04-14T10:00:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000011"), conversationId: ObjectId("65c100000000000000000001"),
    senderId: ObjectId("65c000000000000000000001"), // kien_ceo
    messageType: "Text", content: "Bình và Lan review lại tiến độ quý này nhé, chiều thứ 6 báo cáo.",
    readBy: [ { userId: ObjectId("65c000000000000000000002"), readAt: new Date("2026-04-14T10:15:00Z") } ],
    createdAt: new Date("2026-04-14T10:10:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000001"), // Map với lastMessageId của Conv 1
    conversationId: ObjectId("65c100000000000000000001"),
    senderId: ObjectId("65c000000000000000000002"), // binh_cto
    messageType: "Text", content: "Vâng sếp, team Tech đang chạy đúng timeline, em sẽ tổng hợp lại.",
    readBy: [], // Chưa ai kịp đọc
    createdAt: new Date("2026-04-14T10:30:00Z"), isHidden: false
  },

  // =======================================================================
  // BOX 2: Group Dự án RAG & LLM Chatbot (conversationId: 65c1...02)
  // =======================================================================
  {
    _id: ObjectId("65c200000000000000000012"), conversationId: ObjectId("65c100000000000000000002"),
    senderId: ObjectId("65c000000000000000000003"), // lan_pm
    messageType: "Text", content: "Team báo cáo tiến độ tích hợp LangChain đến đâu rồi ạ?",
    readBy: [ { userId: ObjectId("65c000000000000000000004"), readAt: new Date("2026-04-14T08:35:00Z") } ],
    createdAt: new Date("2026-04-14T08:30:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000013"), conversationId: ObjectId("65c100000000000000000002"),
    senderId: ObjectId("65c000000000000000000004"), // hoang_be
    messageType: "Text", content: "Bên em gọi API đang bị nghẽn do model respond hơi chậm.",
    readBy: [ { userId: ObjectId("65c00000000000000000000a"), readAt: new Date("2026-04-14T08:45:00Z") } ],
    createdAt: new Date("2026-04-14T08:40:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000014"), conversationId: ObjectId("65c100000000000000000002"),
    senderId: ObjectId("65c00000000000000000000a"), // kieulinh_ts
    messageType: "Text", content: "Chắc do chunk size lớn quá. Em sửa lại config", // Tin này sẽ bị thu hồi
    readBy: [],
    createdAt: new Date("2026-04-14T08:50:00Z"), isHidden: true // BỊ THU HỒI (Người dùng sẽ thấy "Tin nhắn đã bị thu hồi")
  },
  {
    _id: ObjectId("65c200000000000000000002"), // Map với lastMessageId của Conv 2
    conversationId: ObjectId("65c100000000000000000002"),
    senderId: ObjectId("65c00000000000000000000a"), // kieulinh_ts
    messageType: "File", content: "Config_LangChain_v2.json", // File đính kèm
    readBy: [ { userId: ObjectId("65c000000000000000000004"), readAt: new Date("2026-04-14T09:20:00Z") } ],
    createdAt: new Date("2026-04-14T09:15:00Z"), isHidden: false
  },

  // =======================================================================
  // BOX 3: Group Support với Khách hàng (conversationId: 65c1...03)
  // =======================================================================
  {
    _id: ObjectId("65c200000000000000000015"), conversationId: ObjectId("65c100000000000000000003"),
    senderId: ObjectId("65c000000000000000000011"), // cuong_client
    messageType: "Image", content: "Lỗi 500 màn hình login", 
    readBy: [ { userId: ObjectId("65c00000000000000000000f"), readAt: new Date("2026-04-13T16:05:00Z") } ],
    createdAt: new Date("2026-04-13T16:00:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000016"), conversationId: ObjectId("65c100000000000000000003"),
    senderId: ObjectId("65c00000000000000000000f"), // dat_sales
    messageType: "Text", content: "Dạ anh đợi chút để em tag bộ phận kỹ thuật kiểm tra ngay ạ.",
    readBy: [ { userId: ObjectId("65c000000000000000000011"), readAt: new Date("2026-04-13T16:15:00Z") } ],
    createdAt: new Date("2026-04-13T16:10:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000003"), // Map với lastMessageId của Conv 3
    conversationId: ObjectId("65c100000000000000000003"),
    senderId: ObjectId("65c000000000000000000003"), // lan_pm
    messageType: "Text", content: "Chào anh Cường, anh vui lòng clear cache trình duyệt rồi thử lại nhé, hệ thống đã up patch mới.",
    readBy: [ { userId: ObjectId("65c000000000000000000011"), readAt: new Date("2026-04-13T16:50:00Z") } ],
    createdAt: new Date("2026-04-13T16:45:00Z"), isHidden: false
  },

  // =======================================================================
  // BOX 4: Group Thông báo công ty (conversationId: 65c1...04)
  // =======================================================================
  {
    _id: ObjectId("65c200000000000000000004"), // Map với lastMessageId của Conv 4
    conversationId: ObjectId("65c100000000000000000004"),
    senderId: ObjectId("65c00000000000000000000d"), // huong_hr
    messageType: "Image", content: "Lịch nghỉ lễ Giỗ Tổ & 30/4",
    readBy: [ { userId: ObjectId("65c000000000000000000001"), readAt: new Date("2026-04-01T08:10:00Z") } ],
    createdAt: new Date("2026-04-01T08:00:00Z"), isHidden: false
  },

  // =======================================================================
  // CÁC HỘI THOẠI TRỰC TIẾP (DIRECT CHAT 1-1)
  // =======================================================================
  
  // BOX 5: Chat 1-1 giữa PM và Backend Node.js
  {
    _id: ObjectId("65c200000000000000000017"), conversationId: ObjectId("65c100000000000000000005"),
    senderId: ObjectId("65c000000000000000000003"), // lan_pm
    messageType: "Text", content: "Tùng ơi em check server chưa, thấy RAM báo đỏ.",
    readBy: [ { userId: ObjectId("65c000000000000000000005"), readAt: new Date("2026-04-14T10:55:00Z") } ],
    createdAt: new Date("2026-04-14T10:50:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000005"), // Map với lastMessage Conv 5
    conversationId: ObjectId("65c100000000000000000005"),
    senderId: ObjectId("65c000000000000000000005"), // tung_node
    messageType: "Text", content: "Em check rồi chị, do mem leak ở pm2. Em vừa restart worker rồi.",
    readBy: [ { userId: ObjectId("65c000000000000000000003"), readAt: new Date("2026-04-14T11:05:00Z") } ],
    createdAt: new Date("2026-04-14T11:00:00Z"), isHidden: false
  },

  // BOX 6: Chat 1-1 Team AI
  {
    _id: ObjectId("65c200000000000000000006"), // Map với lastMessage Conv 6
    conversationId: ObjectId("65c100000000000000000006"),
    senderId: ObjectId("65c00000000000000000000c"), // minh_llm
    messageType: "Text", content: "Cô Linh ơi, mô hình em vừa chạy bị loss hơi cao, chắc do batch size lớn quá.",
    readBy: [], // Chưa đọc
    createdAt: new Date("2026-04-14T08:50:00Z"), isHidden: false
  },

  // BOX 7: Chat 1-1 Marketing và Agency
  {
    _id: ObjectId("65c200000000000000000007"), // Map với lastMessage Conv 7
    conversationId: ObjectId("65c100000000000000000007"),
    senderId: ObjectId("65c00000000000000000000e"), // phuong_mkt
    messageType: "Text", content: "Bên mình đã nhận được Báo giá nhé. Để mình trình sếp Kên rồi báo lại Ngọc.",
    readBy: [ { userId: ObjectId("65c000000000000000000012"), readAt: new Date("2026-04-11T15:00:00Z") } ],
    createdAt: new Date("2026-04-11T14:30:00Z"), isHidden: false
  },

  // BOX 8: Cảnh báo từ Hệ thống tới CEO
  {
    _id: ObjectId("65c200000000000000000018"), conversationId: ObjectId("65c100000000000000000008"),
    senderId: ObjectId("65c000000000000000000013"), // system_bot
    messageType: "System", content: "[ALERT] Server Load exceeds 90%.",
    readBy: [ { userId: ObjectId("65c000000000000000000001"), readAt: new Date("2026-04-14T12:05:00Z") } ],
    createdAt: new Date("2026-04-14T11:55:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000008"), // Map với lastMessage Conv 8
    conversationId: ObjectId("65c100000000000000000008"),
    senderId: ObjectId("65c000000000000000000013"), // system_bot
    messageType: "System", content: "[INFO] Auto-scaling triggered. Added 2 instances.",
    readBy: [], 
    createdAt: new Date("2026-04-14T12:00:00Z"), isHidden: false
  },

  // BOX 9: Spammer gửi tin rác cho HR
  {
    _id: ObjectId("65c200000000000000000019"), conversationId: ObjectId("65c100000000000000000009"),
    senderId: ObjectId("65c000000000000000000014"), // spammer_01
    messageType: "Text", content: "Hello! We have a great crypto investment for you.",
    readBy: [ { userId: ObjectId("65c00000000000000000000d"), readAt: new Date("2026-03-01T00:02:00Z") } ], // Bị xem và sau đó HR Block
    createdAt: new Date("2026-03-01T00:00:00Z"), isHidden: false
  },
  {
    _id: ObjectId("65c200000000000000000009"), // Map với lastMessage Conv 9
    conversationId: ObjectId("65c100000000000000000009"),
    senderId: ObjectId("65c000000000000000000014"), // spammer_01
    messageType: "Image", content: "Click_here_to_claim_1000_USDT.png",
    readBy: [], // Gửi sau khi bị block nên không bao giờ read
    createdAt: new Date("2026-03-01T00:05:00Z"), isHidden: false
  }
]);

db.Attachments.insertMany([
  // =======================================================================
  // 1. Tệp đính kèm của Nhóm Support Khách hàng
  // Map với message: Cường Client gửi ảnh "Lỗi 500 màn hình login"
  // =======================================================================
  {
    _id: ObjectId("65c300000000000000000001"),
    messageId: ObjectId("65c200000000000000000015"), 
    fileName: "login_error_500.png",
    fileType: "image/png",
    fileSize: 245760, // ~240 KB
    fileUrl: "https://s3.techcorp.vn/chat-media/login_error_500.png"
  },

  // =======================================================================
  // 2. Tệp đính kèm của Nhóm AI & Data
  // Map với message: Cô Linh gửi file "Config_LangChain_v2.json"
  // =======================================================================
  {
    _id: ObjectId("65c300000000000000000002"),
    messageId: ObjectId("65c200000000000000000002"), 
    fileName: "Config_LangChain_v2.json",
    fileType: "application/json",
    fileSize: 12288, // ~12 KB
    fileUrl: "https://s3.techcorp.vn/chat-docs/Config_LangChain_v2.json"
  },

  // =======================================================================
  // 3. Tệp đính kèm của Nhóm Thông báo Công ty
  // Map với message: HR Hương gửi ảnh "Lịch nghỉ lễ Giỗ Tổ & 30/4"
  // =======================================================================
  {
    _id: ObjectId("65c300000000000000000003"),
    messageId: ObjectId("65c200000000000000000004"), 
    fileName: "Holiday_Schedule_April_2026.jpg",
    fileType: "image/jpeg",
    fileSize: 1572864, // ~1.5 MB
    fileUrl: "https://s3.techcorp.vn/chat-media/Holiday_Schedule_April_2026.jpg"
  },

  // =======================================================================
  // 4. Tệp đính kèm của đoạn chat lừa đảo (Spam)
  // Map với message: Spammer gửi ảnh chứa mã độc cho HR
  // =======================================================================
  {
    _id: ObjectId("65c300000000000000000004"),
    messageId: ObjectId("65c200000000000000000009"), 
    fileName: "Click_here_to_claim_1000_USDT.png",
    fileType: "image/png",
    fileSize: 819200, // ~800 KB
    fileUrl: "https://malicious-spam.com/fake_crypto_reward.png"
  }
]);

db.Notifications.insertMany([
  // =======================================================================
  // 1. THÔNG BÁO NHÓM: Dự án RAG & LLM Chatbot (PM nhắn hỏi tiến độ)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000001"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "lan_pm: Team báo cáo tiến độ tích hợp LangChain...", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T08:30:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000002"), 
    userId: ObjectId("65c000000000000000000004"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "lan_pm: Team báo cáo tiến độ tích hợp LangChain...", 
    isDelivered: false, // Backend offline
    createdAt: new Date("2026-04-14T08:30:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000003"), 
    userId: ObjectId("65c000000000000000000006"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "lan_pm: Team báo cáo tiến độ tích hợp LangChain...", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T08:30:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000004"), 
    userId: ObjectId("65c00000000000000000000a"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "lan_pm: Team báo cáo tiến độ tích hợp LangChain...", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T08:30:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000005"), 
    userId: ObjectId("65c00000000000000000000c"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "lan_pm: Team báo cáo tiến độ tích hợp LangChain...", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T08:30:02Z") 
  },

  // =======================================================================
  // 2. THÔNG BÁO NHÓM: Cô Linh gửi file config cho team RAG
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000006"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "kieulinh_ts đã gửi tệp Config_LangChain_v2.json", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T09:15:05Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000007"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "kieulinh_ts đã gửi tệp Config_LangChain_v2.json", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T09:15:05Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000008"), 
    userId: ObjectId("65c000000000000000000004"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "kieulinh_ts đã gửi tệp Config_LangChain_v2.json", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T09:15:05Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000009"), 
    userId: ObjectId("65c000000000000000000006"), 
    title: "Dự án: RAG & LLM Chatbot", 
    body: "kieulinh_ts đã gửi tệp Config_LangChain_v2.json", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T09:15:05Z") 
  },

  // =======================================================================
  // 3. THÔNG BÁO BROADCAST: Lịch nghỉ lễ từ HR (Gửi toàn công ty)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000010"), 
    userId: ObjectId("65c000000000000000000001"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: true, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000011"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: true, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000012"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: false, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000013"), 
    userId: ObjectId("65c000000000000000000004"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: true, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000014"), 
    userId: ObjectId("65c000000000000000000005"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: true, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000015"), 
    userId: ObjectId("65c000000000000000000006"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: false, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000016"), 
    userId: ObjectId("65c00000000000000000000e"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: true, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000017"), 
    userId: ObjectId("65c00000000000000000000f"), 
    title: "Thông báo chung", 
    body: "huong_hr đã gửi 1 hình ảnh: Lịch nghỉ lễ Giỗ Tổ & 30/4", 
    isDelivered: true, 
    createdAt: new Date("2026-04-01T08:00:10Z") 
  },

  // =======================================================================
  // 4. THÔNG BÁO TỪ BOT HỆ THỐNG: Cảnh báo Server quá tải
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000018"), 
    userId: ObjectId("65c000000000000000000001"), 
    title: "Cảnh báo Server", 
    body: "[ALERT] Server Load exceeds 90%", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T11:55:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000019"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Cảnh báo Server", 
    body: "[ALERT] Server Load exceeds 90%", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T11:55:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000020"), 
    userId: ObjectId("65c000000000000000000004"), 
    title: "Cảnh báo Server", 
    body: "[ALERT] Server Load exceeds 90%", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T11:55:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000021"), 
    userId: ObjectId("65c000000000000000000001"), 
    title: "Thông báo Server", 
    body: "[INFO] Auto-scaling triggered. Added 2 instances.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T12:00:05Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000022"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Thông báo Server", 
    body: "[INFO] Auto-scaling triggered. Added 2 instances.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T12:00:05Z") 
  },

  // =======================================================================
  // 5. THÔNG BÁO TIN NHẮN TRỰC TIẾP (Các đoạn chat cũ)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000023"), 
    userId: ObjectId("65c000000000000000000005"), 
    title: "lan_pm", 
    body: "Tùng ơi em check server chưa, thấy RAM báo đỏ.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T10:50:05Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000024"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "tung_node", 
    body: "Em check rồi chị, do mem leak ở pm2...", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T11:00:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000025"), 
    userId: ObjectId("65c00000000000000000000a"), 
    title: "minh_llm", 
    body: "Cô Linh ơi, mô hình em vừa chạy bị loss...", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T08:50:03Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000026"), 
    userId: ObjectId("65c000000000000000000012"), 
    title: "phuong_mkt", 
    body: "Bên mình đã nhận được Báo giá nhé...", 
    isDelivered: true, 
    createdAt: new Date("2026-04-11T14:30:05Z") 
  },

  // =======================================================================
  // 6. THÔNG BÁO SUPPORT KHÁCH HÀNG (Groups: Sales + PM + Client)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000027"), 
    userId: ObjectId("65c00000000000000000000f"), 
    title: "Support: Partner-Corp VN", 
    body: "cuong_client đã gửi 1 hình ảnh", 
    isDelivered: true, 
    createdAt: new Date("2026-04-13T16:00:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000028"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "Support: Partner-Corp VN", 
    body: "cuong_client đã gửi 1 hình ảnh", 
    isDelivered: true, 
    createdAt: new Date("2026-04-13T16:00:02Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000029"), 
    userId: ObjectId("65c000000000000000000011"), 
    title: "Support: Partner-Corp VN", 
    body: "dat_sales: Dạ anh đợi chút để em tag bộ phận...", 
    isDelivered: true, 
    createdAt: new Date("2026-04-13T16:10:05Z") 
  },

  // =======================================================================
  // 7. THÔNG BÁO TỪ SPAMMER (Bị chặn)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000030"), 
    userId: ObjectId("65c00000000000000000000d"), 
    title: "spammer_01", 
    body: "Hello! We have a great crypto investment...", 
    isDelivered: false, 
    createdAt: new Date("2026-03-01T00:00:05Z") 
  },

  // =======================================================================
  // 8. THÔNG BÁO TỪ DỰ ÁN VIMIND (Multi-Agent RAG & LangGraph)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000031"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "ViMind - Cảnh báo Logic", 
    body: "hoang_be đã nhắc đến bạn: 'Anh Bình xem lại node phân loại tâm lý ở LangGraph đang bị lặp vô hạn kìa.'", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T13:00:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000032"), 
    userId: ObjectId("65c00000000000000000000a"), 
    title: "ViMind Research", 
    body: "minh_llm đã gửi một báo cáo mới về độ chính xác của RAG trên tập dataset tâm lý Việt Nam.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T14:20:00Z") 
  },

  // =======================================================================
  // 9. THÔNG BÁO TỪ DỰ ÁN SLIDEGEN (Pitching & Monetization)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000033"), 
    userId: ObjectId("65c000000000000000000010"), 
    title: "SlideGen Pitching Strategy", 
    body: "binh_cto: 'Dạ anh, gói 20.000 token miễn phí đã được cấu hình xong, không cần đăng ký tài khoản.'", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T15:00:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000034"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "SlideGen Design", 
    body: "mai_fe: 'Em đã cập nhật UI cho phần chọn Layout linh hoạt, chị xem thử nhé.'", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T15:30:00Z") 
  },

  // =======================================================================
  // 10. THÔNG BÁO HỆ THỐNG & AI INFRASTRUCTURE (H100, PEFT, GRPO)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000035"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Hệ thống GPU", 
    body: "[INFO] Tiến trình Fine-tuning PEFT trên cụm H100 đã hoàn thành 100%.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T16:00:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000036"), 
    userId: ObjectId("65c00000000000000000000a"), 
    title: "Hệ thống AI", 
    body: "Cảnh báo: Loss của mô hình GRPO đang có dấu hiệu bùng nổ (diverge) tại epoch 5.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T16:15:00Z") 
  },

  // =======================================================================
  // 11. THÔNG BÁO TỔ CHỨC & PTIT
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000037"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "Lịch họp PTIT", 
    body: "TS. Nguyễn Kiều Linh đã mời bạn tham gia buổi seminar về 'Ứng dụng LLM trong hỗ trợ tâm lý'.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T17:00:00Z") 
  },

  // =======================================================================
  // 12. CÁC THÔNG BÁO CHAT 1-1 CHI TIẾT (Liên kết chính xác với Users)
  // =======================================================================
  { 
    _id: ObjectId("65c400000000000000000038"), 
    userId: ObjectId("65c000000000000000000004"), 
    title: "Tin nhắn từ tung_node", 
    body: "Check lại hộ em cái JOIN bên SQL Server cái, lag quá.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T09:00:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000039"), 
    userId: ObjectId("65c000000000000000000005"), 
    title: "Tin nhắn từ hoang_be", 
    body: "Đã tối ưu xong query cho Clinic Management rồi nhé.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T09:30:00Z") 
  },
  { 
    _id: ObjectId("65c40000000000000000003a"), 
    userId: ObjectId("65c000000000000000000006"), 
    title: "Tin nhắn từ quang_vue", 
    body: "Cái React Hook ở màn hình Chat bị re-render liên tục kìa.", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T10:15:00Z") 
  },
  { 
    _id: ObjectId("65c40000000000000000003b"), 
    userId: ObjectId("65c000000000000000000008"), 
    title: "Tin nhắn từ linh_qa", 
    body: "Phát hiện bug: Tin nhắn thu hồi vẫn hiển thị ở notification.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T11:00:00Z") 
  },
  { 
    _id: ObjectId("65c40000000000000000003c"), 
    userId: ObjectId("65c000000000000000000009"), 
    title: "Tin nhắn từ hoang_be", 
    body: "VMLU Benchmark xong rồi, gửi cô Linh chưa?", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T11:20:00Z") 
  },
  { 
    _id: ObjectId("65c40000000000000000003d"), 
    userId: ObjectId("65c00000000000000000000b"), 
    title: "Tin nhắn từ minh_llm", 
    body: "Data Eng đã clean xong bộ dataset tâm lý chưa anh?", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T13:45:00Z") 
  },
  { 
    _id: ObjectId("65c40000000000000000003e"), 
    userId: ObjectId("65c00000000000000000000e"), 
    title: "Tin nhắn từ dat_sales", 
    body: "Bên Agency Ngọc gửi mẫu Slide Pitch Deck mới rồi đấy.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T14:10:00Z") 
  },
  { 
    _id: ObjectId("65c40000000000000000003f"), 
    userId: ObjectId("65c000000000000000000001"), 
    title: "Tin nhắn từ binh_cto", 
    body: "Sếp ơi, em vừa test thử con Qwen3-4B, tốc độ inference nhanh kinh khủng.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T14:30:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000040"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Tin nhắn từ kien_ceo", 
    body: "Ok, chuẩn bị demo cho bên nhà đầu tư vào sáng mai nhé.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T14:35:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000041"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "Tin nhắn từ huong_hr", 
    body: "Chị Lan ơi, em gửi danh sách ứng viên thực tập AI từ PTIT.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T15:00:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000042"), 
    userId: ObjectId("65c00000000000000000000d"), 
    title: "Tin nhắn từ phuong_mkt", 
    body: "Bên mình có cần làm video teaser cho ViMind không chị?", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T15:15:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000043"), 
    userId: ObjectId("65c00000000000000000000f"), 
    title: "Tin nhắn từ ngoc_agency", 
    body: "File báo giá Marketing Quý 2 em gửi qua email rồi ạ.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T16:00:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000044"), 
    userId: ObjectId("65c000000000000000000011"), 
    title: "Tin nhắn từ dat_sales", 
    body: "Anh Cường ơi, bên em vừa cập nhật tính năng mới cho app.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T16:20:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000045"), 
    userId: ObjectId("65c000000000000000000002"), 
    title: "Tin nhắn từ duc_de", 
    body: "Pipeline dữ liệu từ MongoDB sang Data Warehouse đã chạy xong lúc 2AM.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T02:05:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000046"), 
    userId: ObjectId("65c000000000000000000004"), 
    title: "Tin nhắn từ linh_qa", 
    body: "Anh check lại API upload file nhé, bị timeout khi file > 50MB.", 
    isDelivered: false, 
    createdAt: new Date("2026-04-14T10:45:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000047"), 
    userId: ObjectId("65c000000000000000000005"), 
    title: "Tin nhắn từ mai_fe", 
    body: "Cái socket.io bị disconnect liên tục trên mobile browser, anh Tùng xem log thử.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T11:15:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000048"), 
    userId: ObjectId("65c00000000000000000000c"), 
    title: "Tin nhắn từ hoang_be", 
    body: "Em đẩy endpoint gọi API của model gemma-4-31B lên staging rồi nhé.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T14:50:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000049"), 
    userId: ObjectId("65c000000000000000000001"), 
    title: "Tin nhắn từ dat_sales", 
    body: "Khách hàng chốt deal gói Enterprise 1 năm rồi sếp ạ!", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T16:45:00Z") 
  },
  { 
    _id: ObjectId("65c400000000000000000050"), 
    userId: ObjectId("65c000000000000000000003"), 
    title: "Tin nhắn từ hieu_investor", 
    body: "Lan sắp xếp lịch meeting team tuần sau để chốt term sheet nhé.", 
    isDelivered: true, 
    createdAt: new Date("2026-04-14T17:10:00Z") 
  }
]);