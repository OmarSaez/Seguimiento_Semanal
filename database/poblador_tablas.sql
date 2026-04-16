-- Script para poblar tablas con datos iniciales
-- Proyecto: Seguimiento Semanal

-- 1. Insertar Profesor (Admin)
-- Omar, omar.saez@usach.cl, test1234
INSERT INTO teacher (name, email, password) 
VALUES ('Omar Saez', 'omar.saez@usach.cl', 'test1234');

-- 2. Insertar una Sección
-- Asignado al profesor Omar (ID 1)
INSERT INTO section (section_code, semester, year, id_teacher, is_active, start_date, finish_date)
VALUES ('INF-612', 1, 2026, 1, true, '2026-03-30', '2026-08-14');

-- 3. Insertar un Estudiante
-- student1.test@usach.cl, student1, test
-- Asignado a la sección INF-612 (ID 1)
INSERT INTO student (email, name, lastname, id_section)
VALUES ('student1.test@usach.cl', 'student1', 'test', 1);

-- 4.-- Insertar Proyectos (Asumimos ID 1 para la sección INF-612)
INSERT INTO proyect (name, code, id_section) VALUES ('Desarrollo Backend en Spring Boot', 'P01', 1);
INSERT INTO proyect (name, code, id_section) VALUES ('Maquetación Frontend en React', 'P02', 1);
