-- =====================================================================
--  TIGER SHOP - LUOC DO CO SO DU LIEU DAY DU (23 bang)
-- =====================================================================
--  Tep nay duoc dung de tai lap toan bo luoc do tu dau.
--
--  NGUON GOC: lay tu 3 nguon va hop nhat lai
--    1. database/ecommerce.sql          -> roles, users (ban toi gian)
--    2. database/migrations/*.sql       -> 12 bang
--    3. SUY RA TU MA NGUON backend/     -> 9 bang/cot khong duoc dinh nghia
--                                          o bat ky dau trong kho ma nguon
--
--  CANH BAO: cac bang categories, product_variants, vouchers,
--  user_vouchers, threads, chat_messages, user_activity_logs va nhieu cot
--  cua users/products/orders/order_items KHONG co dinh nghia goc trong kho
--  ma nguon. Kieu du lieu va rang buoc cua chung duoc SUY RA tu cac cau
--  truy van trong backend/controllers va backend/models. Can doi chieu voi
--  co so du lieu dang chay tren may nhom phat trien truoc khi dung chinh thuc.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------- roles
CREATE TABLE IF NOT EXISTS roles (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- users
CREATE TABLE IF NOT EXISTS users (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  name                   VARCHAR(100),
  email                  VARCHAR(100) UNIQUE,
  password               VARCHAR(255),
  phone                  VARCHAR(20),
  avatar                 VARCHAR(255),
  birthday               DATE NULL,
  role_id                INT,
  status                 VARCHAR(20)    NOT NULL DEFAULT 'pending',
  is_active              TINYINT(1)     NOT NULL DEFAULT 1,
  created_by             INT NULL,
  hourly_rate            DECIMAL(10,2)  NOT NULL DEFAULT 30000.00,
  employment_status      VARCHAR(20)    NOT NULL DEFAULT 'official',
  probation_start_at     DATETIME NULL,
  official_at            DATETIME NULL,
  probation_hourly_rate  DECIMAL(10,2)  NOT NULL DEFAULT 20000.00,
  official_hourly_rate   DECIMAL(10,2)  NOT NULL DEFAULT 25000.00,
  deleted_at             DATETIME NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id)    REFERENCES roles(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_users_created_by (created_by),
  INDEX idx_users_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------- categories
CREATE TABLE IF NOT EXISTS categories (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  display_type VARCHAR(50)  NOT NULL DEFAULT 'general',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------- products
CREATE TABLE IF NOT EXISTS products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  price            DECIMAL(12,2) NOT NULL DEFAULT 0,
  original_price   DECIMAL(12,2) NULL,
  description      TEXT,
  stock            INT NOT NULL DEFAULT 0,
  image            VARCHAR(255),
  category_id      INT NULL,
  manager_id       INT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  display_type     VARCHAR(50) NOT NULL DEFAULT 'general',
  specifications   JSON NULL,
  embedding        LONGTEXT NULL,
  rejection_reason VARCHAR(255) NULL,
  deleted_at       DATETIME NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id)  REFERENCES users(id)      ON DELETE SET NULL,
  INDEX idx_products_status  (status),
  INDEX idx_products_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------- product_variants
CREATE TABLE IF NOT EXISTS product_variants (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL,
  sku          VARCHAR(100) NULL,
  variant_name VARCHAR(255) NOT NULL,
  price        DECIMAL(12,2) NOT NULL,
  stock        INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variants_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------ product_reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id    INT NOT NULL,
  rating     INT NOT NULL,
  comment    TEXT,
  image_url  VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_user_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_product_reviews_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------- orders
CREATE TABLE IF NOT EXISTS orders (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NULL,
  total             DECIMAL(12,2) NOT NULL DEFAULT 0,
  status            VARCHAR(50) NOT NULL DEFAULT 'pending',
  receiver_name     VARCHAR(100),
  receiver_phone    VARCHAR(20),
  shipping_address  VARCHAR(255),
  expected_delivery DATE NULL,
  payment_method    VARCHAR(20) NOT NULL DEFAULT 'cod',
  cancel_reason     VARCHAR(255) NULL,
  processed_by      INT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orders_status (status),
  INDEX idx_orders_user   (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  product_id    INT NULL,
  variant_id    INT NULL,
  quantity      INT NOT NULL DEFAULT 1,
  price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  product_name  VARCHAR(255),
  product_image VARCHAR(255),
  FOREIGN KEY (order_id)   REFERENCES orders(id)           ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------- order_logs
CREATE TABLE IF NOT EXISTS order_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  user_id    INT NULL,
  action     VARCHAR(50) NOT NULL,
  old_value  VARCHAR(255),
  new_value  VARCHAR(255),
  note       TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------ return_requests
CREATE TABLE IF NOT EXISTS return_requests (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  order_id   INT NOT NULL,
  reason     TEXT NOT NULL,
  status     VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------- vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  voucher_id      INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50) NOT NULL UNIQUE,
  type            VARCHAR(20) NOT NULL DEFAULT 'percent',
  value           DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_order_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_discount    DECIMAL(12,2) NULL,
  quantity        INT NOT NULL DEFAULT 0,
  used            INT NOT NULL DEFAULT 0,
  start_date      DATE NULL,
  end_date        DATE NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  source          VARCHAR(30) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vouchers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------- user_vouchers
CREATE TABLE IF NOT EXISTS user_vouchers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  voucher_id  INT NOT NULL,
  used        TINYINT(1) NOT NULL DEFAULT 0,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_voucher (user_id, voucher_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)          ON DELETE CASCADE,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------- threads
CREATE TABLE IF NOT EXISTS threads (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  status      VARCHAR(30) NOT NULL DEFAULT 'open',
  is_ai_muted TINYINT(1)  NOT NULL DEFAULT 0,
  is_human_needed TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Dat boi POST /api/chat/switch-to-human',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_thread_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  thread_id   INT NOT NULL,
  sender_role VARCHAR(20) NOT NULL,
  sender_id   INT NULL,
  receiver_id INT NULL,
  message     TEXT NOT NULL,
  order_id    INT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'text',
  sentiment   VARCHAR(20) NULL COMMENT 'Cam xuc khach hang do AI phan tich trong socket.js',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id)  REFERENCES orders(id)  ON DELETE SET NULL,
  INDEX idx_chat_thread_time (thread_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------- ai_chat_sessions
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ai_session_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------- ai_chat_messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  role       ENUM('USER','AI') NOT NULL,
  message    TEXT NOT NULL,
  voucher    VARCHAR(50) NULL COMMENT 'Ma voucher neu AI phat ra',
  metadata   JSON NULL COMMENT 'Context bo sung: intent, voucher, v.v.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  INDEX idx_ai_messages_session (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) NOT NULL,
  is_read    TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------- inventory_logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  product_id     INT NOT NULL,
  manager_id     INT NOT NULL,
  quantity_added INT NOT NULL,
  old_stock      INT NOT NULL,
  new_stock      INT NOT NULL,
  note           VARCHAR(255),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_inventory_logs_manager (manager_id),
  INDEX idx_inventory_logs_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------- user_activity_logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NULL,
  action     VARCHAR(255) NOT NULL,
  target_id  INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------ staff_work_logs
CREATE TABLE IF NOT EXISTS staff_work_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  staff_id     INT NOT NULL,
  manager_id   INT NOT NULL,
  work_date    DATE NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL,
  note         VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_staff_work_logs_staff_date (staff_id, work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------- attendance_sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  staff_id                INT NOT NULL,
  check_in_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out_at            DATETIME NULL,
  worked_seconds          INT NOT NULL DEFAULT 0,
  wage_rate               DECIMAL(10,2) NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'open',
  note                    VARCHAR(255),
  corrected_by_manager_id INT NULL,
  corrected_at            DATETIME NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id)                REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (corrected_by_manager_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_attendance_staff_status (staff_id, status),
  INDEX idx_attendance_checkin (check_in_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------- staff_requests
CREATE TABLE IF NOT EXISTS staff_requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  staff_id     INT NOT NULL,
  manager_id   INT NULL,
  request_type VARCHAR(20) NOT NULL COMMENT 'late | leave | refund',
  order_id     INT NULL COMMENT 'Chi dung khi request_type = refund',
  request_date DATE NOT NULL,
  minutes_late INT NULL,
  reason       VARCHAR(255) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  manager_note VARCHAR(255) NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_staff_requests_status (status, request_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------- shift_registrations
CREATE TABLE IF NOT EXISTS shift_registrations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  staff_id   INT NOT NULL,
  manager_id INT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  note       VARCHAR(255) NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_shift_registrations_status (status, shift_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
--  SEED ROLES
--  Ma nguon dung: role_id = 1 (ADMIN), 2 (MANAGER), 3 (STAFF), 5 (CUSTOMER)
--  Xem authController.register (role_id = 5) va userController (role_id = 3)
-- =====================================================================
INSERT INTO roles (id, name) VALUES
  (1, 'ADMIN'), (2, 'MANAGER'), (3, 'STAFF'), (4, 'WAREHOUSE'), (5, 'CUSTOMER')
ON DUPLICATE KEY UPDATE name = VALUES(name);
