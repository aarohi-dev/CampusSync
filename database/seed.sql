-- Campus Sync - Sample Seed Data (NORMALIZED)
-- Insert sample data for testing with normalized schema

USE campus_sync;

-- ================================================================================
-- SEED DATA FOR LOOKUP TABLES (1NF NORMALIZED)
-- ================================================================================

-- Insert roles
INSERT INTO roles (role_name, description) VALUES 
('STUDENT', 'Student can book resources'),
('FACULTY', 'Faculty can book resources'),
('ADMIN', 'Admin can manage all resources and bookings');

-- Insert resource types (replaces ENUM)
INSERT INTO resource_types (type_name, description) VALUES 
('lab', 'Computer or Science Laboratory'),
('seminar_hall', 'Seminar or Meeting Hall'),
('projector', 'Projector Equipment');

-- Insert booking statuses (replaces ENUM)
INSERT INTO booking_statuses (status_name, description) VALUES 
('PENDING', 'Booking awaiting approval'),
('APPROVED', 'Booking approved and confirmed'),
('REJECTED', 'Booking rejected by admin');

-- Insert audit action types (replaces string actions)
INSERT INTO audit_action_types (action_type, description) VALUES 
('BOOKING_CREATED', 'New booking created'),
('BOOKING_APPROVED', 'Booking approved by admin'),
('BOOKING_REJECTED', 'Booking rejected by admin'),
('BOOKING_CANCELLED', 'Booking cancelled by user'),
('RESOURCE_CREATED', 'New resource created'),
('RESOURCE_UPDATED', 'Resource details updated'),
('RESOURCE_DEACTIVATED', 'Resource marked inactive'),
('USER_CREATED', 'New user account created'),
('USER_UPDATED', 'User profile updated'),
('USER_LOGIN', 'User logged in successfully'),
('USER_REGISTRATION', 'New user registered');

-- Insert locations (replaces location string)
INSERT INTO locations (building_name, floor, room_number, description) VALUES 
('Building A', 2, '201', 'Computer Lab A'),
('Building B', 3, '305', 'Computer Lab B'),
('Building A', 1, '101', 'Seminar Hall 101'),
('Building C', 2, '202', 'Seminar Hall 202'),
('Main Office', NULL, 'A1', 'Main Office Storage'),
('Main Office', NULL, 'A2', 'Main Office Storage');

-- ================================================================================
-- SEED DATA FOR MAIN TABLES (2NF/3NF)
-- ================================================================================

-- Insert sample users
-- Password: student123 (hashed)
INSERT INTO users (name, email, password, role_id, is_active) VALUES 
('John Doe', 'john.doe@campus.edu', '$2b$10$KIXxPfxgZ5NQVQZsGjB2WOXJ8rHykIaYm3d6/oM9nKlKNh5D.Ym.C', 1, TRUE);

-- Password: faculty123 (hashed)
INSERT INTO users (name, email, password, role_id, is_active) VALUES 
('Dr. Sarah Smith', 'sarah.smith@campus.edu', '$2b$10$vJ.3X5Q6Z8N2MKjL9dR3B.5X2NkP7gH4jQ8kLmN1oP2vW9.eJ', 2, TRUE);

-- Password: admin123 (hashed)
INSERT INTO users (name, email, password, role_id, is_active) VALUES 
('Admin User', 'admin@campus.edu', '$2b$10$J2kR5mPqL3oNyX1vW4yZ.8K4nMp9sT2uV6xQ3rS5eH7jL9mN.Bb', 3, TRUE);

INSERT INTO users (name, email, password, role_id, is_active) VALUES 
('Jane Wilson', 'jane.wilson@campus.edu', '$2b$10$KIXxPfxgZ5NQVQZsGjB2WOXJ8rHykIaYm3d6/oM9nKlKNh5D.Ym.C', 1, TRUE);

INSERT INTO users (name, email, password, role_id, is_active) VALUES 
('Prof. Michael Brown', 'michael.brown@campus.edu', '$2b$10$vJ.3X5Q6Z8N2MKjL9dR3B.5X2NkP7gH4jQ8kLmN1oP2vW9.eJ', 2, TRUE);

-- Insert sample resources (now with normalized FKs)
INSERT INTO resources (name, resource_type_id, location_id, capacity, is_active) VALUES 
('Computer Lab A', 1, 1, 30, TRUE);

INSERT INTO resources (name, resource_type_id, location_id, capacity, is_active) VALUES 
('Computer Lab B', 1, 2, 25, TRUE);

INSERT INTO resources (name, resource_type_id, location_id, capacity, is_active) VALUES 
('Seminar Hall 101', 2, 3, 50, TRUE);

INSERT INTO resources (name, resource_type_id, location_id, capacity, is_active) VALUES 
('Seminar Hall 202', 2, 4, 40, TRUE);

INSERT INTO resources (name, resource_type_id, location_id, capacity, is_active) VALUES 
('Projector Unit 1', 3, 5, 1, TRUE);

INSERT INTO resources (name, resource_type_id, location_id, capacity, is_active) VALUES 
('Projector Unit 2', 3, 6, 1, TRUE);

-- Insert sample bookings (now with normalized status FK)
INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status_id) VALUES 
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '11:00:00', 2);

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status_id) VALUES 
(1, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', '12:00:00', 1);

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status_id) VALUES 
(2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 2);

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status_id) VALUES 
(4, 2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '13:00:00', '15:00:00', 1);

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status_id, rejection_reason) VALUES 
(4, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 3, 'Resource unavailable');

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status_id) VALUES 
(5, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '11:00:00', 2);

-- Insert sample audit logs (now with normalized action type FK)
INSERT INTO audit_logs (action_type_id, user_id, resource_id, booking_id, action_details) VALUES 
(2, 3, 1, 1, JSON_OBJECT('approver_id', 3, 'reason', 'Resource available'));

INSERT INTO audit_logs (action_type_id, user_id, resource_id, booking_id, action_details) VALUES 
(3, 3, 1, 5, JSON_OBJECT('approver_id', 3, 'reason', 'Resource unavailable'));

INSERT INTO audit_logs (action_type_id, user_id, resource_id, action_details) VALUES 
(5, 3, 1, JSON_OBJECT('resource_name', 'Computer Lab A'));

INSERT INTO audit_logs (action_type_id, user_id, action_details) VALUES 
(8, 3, JSON_OBJECT('user_email', 'john.doe@campus.edu', 'role', 'STUDENT'));
