-- Script para poblar tablas con datos iniciales
-- Proyecto: Seguimiento Semanal

-- 1. Insertar Profesor (Admin)
-- Omar, omar.saez@usach.cl, test1234
INSERT INTO teacher (name, email, password) 
VALUES ('Omar Saez', 'omar.saez@usach.cl', 'test1234');

-- 2. Insertar una Sección
-- Asignado al profesor Omar (ID 1)
INSERT INTO section (section_code, semester, year, id_teacher, is_active)
VALUES ('INF-612', 1, 2026, 1, true);

-- 3. Insertar un Estudiante
-- student1.test@usach.cl, student1, test
-- Asignado a la sección INF-612 (ID 1)
INSERT INTO student (email, name, lastname, password, id_section)
VALUES ('student1.test@usach.cl', 'student1', 'test', 'test', 1);

-- 4. Insertar un Proyecto para la sección
INSERT INTO proyect (name, id_section)
VALUES ('Sistema de Seguimiento Semanal', 1);
