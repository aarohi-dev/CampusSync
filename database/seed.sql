-- Campus Sync - Sample Seed Data
-- Insert sample data for testing

USE campus_sync;

-- Insert roles
INSERT INTO roles (role_name) VALUES ('STUDENT');
INSERT INTO roles (role_name) VALUES ('FACULTY');
INSERT INTO roles (role_name) VALUES ('ADMIN');

-- Insert sample users
-- Password: student123 (hashed)
INSERT INTO users (name, email, password, role_id) VALUES 
('John Doe', 'john.doe@campus.edu', '$2b$10$KIXxPfxgZ5NQVQZsGjB2WOXJ8rHykIaYm3d6/oM9nKlKNh5D.Ym.C', 1);

-- Password: faculty123 (hashed)
INSERT INTO users (name, email, password, role_id) VALUES 
('Dr. Sarah Smith', 'sarah.smith@campus.edu', '$2b$10$vJ.3X5Q6Z8N2MKjL9dR3B.5X2NkP7gH4jQ8kLmN1oP2vW9.eJ', 2);

-- Password: admin123 (hashed)
INSERT INTO users (name, email, password, role_id) VALUES 
('Admin User', 'admin@campus.edu', '$2b$10$J2kR5mPqL3oNyX1vW4yZ.8K4nMp9sT2uV6xQ3rS5eH7jL9mN.Bb', 3);

INSERT INTO users (name, email, password, role_id) VALUES 
('Jane Wilson', 'jane.wilson@campus.edu', '$2b$10$KIXxPfxgZ5NQVQZsGjB2WOXJ8rHykIaYm3d6/oM9nKlKNh5D.Ym.C', 1);

INSERT INTO users (name, email, password, role_id) VALUES 
('Prof. Michael Brown', 'michael.brown@campus.edu', '$2b$10$vJ.3X5Q6Z8N2MKjL9dR3B.5X2NkP7gH4jQ8kLmN1oP2vW9.eJ', 2);

-- Insert sample resources
INSERT INTO resources (name, type, location, capacity, is_active) VALUES 
('Computer Lab A', 'lab', 'Building A, 2nd Floor', 30, TRUE);

INSERT INTO resources (name, type, location, capacity, is_active) VALUES 
('Computer Lab B', 'lab', 'Building B, 3rd Floor', 25, TRUE);

INSERT INTO resources (name, type, location, capacity, is_active) VALUES 
('Seminar Hall 101', 'seminar_hall', 'Building A, 1st Floor', 50, TRUE);

INSERT INTO resources (name, type, location, capacity, is_active) VALUES 
('Seminar Hall 202', 'seminar_hall', 'Building C, 2nd Floor', 40, TRUE);

INSERT INTO resources (name, type, location, capacity, is_active) VALUES 
('Projector Unit 1', 'projector', 'Main Office', 1, TRUE);

INSERT INTO resources (name, type, location, capacity, is_active) VALUES 
('Projector Unit 2', 'projector', 'Main Office', 1, TRUE);

-- Insert sample bookings (mix of statuses)
-- Today's date assumed for testing
INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status) VALUES 
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '11:00:00', 'APPROVED');

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status) VALUES 
(1, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', '12:00:00', 'PENDING');

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status) VALUES 
(2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 'APPROVED');

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status) VALUES 
(4, 2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '13:00:00', '15:00:00', 'PENDING');

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status) VALUES 
(4, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 'REJECTED', 'Resource unavailable');

INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status) VALUES 
(5, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '11:00:00', 'APPROVED');

-- Insert sample audit logs
INSERT INTO audit_logs (action, user_id, resource_id, booking_id, action_details) VALUES 
('BOOKING_APPROVED', 3, 1, 1, JSON_OBJECT('approver_id', 3, 'reason', 'Resource available'));

INSERT INTO audit_logs (action, user_id, resource_id, booking_id, action_details) VALUES 
('BOOKING_REJECTED', 3, 1, 5, JSON_OBJECT('approver_id', 3, 'reason', 'Resource unavailable'));

INSERT INTO audit_logs (action, user_id, resource_id, action_details) VALUES 
('RESOURCE_CREATED', 3, 1, JSON_OBJECT('resource_name', 'Computer Lab A'));

INSERT INTO audit_logs (action, user_id, action_details) VALUES 
('USER_CREATED', 3, JSON_OBJECT('user_email', 'john.doe@campus.edu', 'role', 'STUDENT'));
