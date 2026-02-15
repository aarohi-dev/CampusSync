-- Campus Sync Resource Booking System - MySQL Schema
-- Database for managing campus resource bookings

CREATE DATABASE IF NOT EXISTS campus_sync;
USE campus_sync;

-- 1. Roles Table
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  INDEX idx_email (email),
  INDEX idx_role_id (role_id)
);

-- 3. Resources Table
CREATE TABLE resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('lab', 'seminar_hall', 'projector') NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_is_active (is_active)
);

-- 4. Bookings Table
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  rejection_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_resource_id (resource_id),
  INDEX idx_status (status),
  INDEX idx_date (booking_date),
  INDEX idx_resource_date (resource_id, booking_date, status),
  CONSTRAINT check_time CHECK (start_time < end_time)
);

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  resource_id INT,
  booking_id INT,
  action_details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp)
);

-- Create unique constraint to prevent duplicate APPROVED bookings for same resource, date, and overlapping times
-- This is enforced through application logic, but we create a trigger for extra safety
DELIMITER //

CREATE TRIGGER check_booking_overlap BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  DECLARE overlap_count INT;
  
  -- Check if there's an overlapping APPROVED booking
  SELECT COUNT(*) INTO overlap_count
  FROM bookings
  WHERE resource_id = NEW.resource_id
    AND booking_date = NEW.booking_date
    AND status = 'APPROVED'
    AND (
      (NEW.start_time < end_time AND NEW.end_time > start_time)
    );
  
  IF overlap_count > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource already booked for this time slot';
  END IF;
END //

DELIMITER ;
