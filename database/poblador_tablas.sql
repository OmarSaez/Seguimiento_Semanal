-- Script de Poblado Limpio y Robusto 
-- Uso: Ejecutar TODO el script de una vez.

-- 1. Limpieza total con reinicio de IDs
TRUNCATE TABLE teacher, section, proyect, student, advance, advance_detail, advance_future RESTART IDENTITY CASCADE;

-- 2. Profesores (Pass: test1234)
INSERT INTO teacher (name, email, password) VALUES 
('Omar Saez', 'omar.saez@usach.cl', 'test1234'),
('Alvaro Yañez', 'alvaro.yanez@usach.cl', 'test1234');

-- 3. Secciones
INSERT INTO section (section_code, semester, year, id_teacher, is_active, start_date, finish_date) VALUES 
('INF-612-O', 1, 2026, 1, true, '2026-03-30', '2026-08-14'),
('INF-612-A', 1, 2026, 2, true, '2026-03-30', '2026-08-14');

-- 4. Proyectos
INSERT INTO proyect (name, code, id_section) VALUES 
('Frutos Secos Mil Sabores', 'P03', 1),
('Marroquineria Balta', 'P08', 1),
('SGT HUAP', 'P13', 1),
('Decoaromas', 'P04', 2),
('Demaria Respaldos y Muebles SPA', 'P06', 2),
('Centro emprendedor Colina', 'P09', 2);

-- 5. Estudiantes
INSERT INTO student (email, name, lastname, id_section) VALUES 
('juan.perez@usach.cl', 'Juan', 'Perez', 1),
('maria.gomez@usach.cl', 'Maria', 'Gomez', 1),
('diego.torres@usach.cl', 'Diego', 'Torres', 1),
('carla.rojas@usach.cl', 'Carla', 'Rojas', 2),
('nicolas.soto@usach.cl', 'Nicolas', 'Soto', 2),
('valentina.paz@usach.cl', 'Valentina', 'Paz', 2);

-- 6. Avances
-- Juan Perez (ID 1) -> IDs 1, 2, 3
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(1, 1, '2026-04-05 18:00:00', 1, 'Ninguno'),
(1, 1, '2026-04-12 19:30:00', 2, 'Ninguno'),
(1, 1, '2026-04-15 10:15:00', 3, 'Retraso en entrega de API por parte del cliente');

-- Maria Gomez (ID 2) -> IDs 4, 5
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(2, 2, '2026-04-06 09:00:00', 1, 'Ninguno'),
(2, 2, '2026-04-13 14:20:00', 2, 'Ninguno');

-- Diego Torres (ID 3) -> IDs 6, 7
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(3, 3, '2026-04-05 22:00:00', 1, 'Ninguno'),
(3, 3, '2026-04-12 21:00:00', 2, 'Ninguno');

-- Carla Rojas (ID 4) -> IDs 8, 9
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(4, 4, '2026-04-04 11:00:00', 1, 'Ninguno'),
(4, 4, '2026-04-11 15:00:00', 2, 'Ninguno');

-- Nicolas Soto (ID 5) -> ID 10
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(5, 5, '2026-04-14 16:00:00', 2, 'Ninguno');

-- 7. Detalles (Mínimo 1, Máximo 3 por reporte)
-- Juan Perez (ID 1 al 3)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(1, 'Diseño/Desarrollo de Software', 'Creación de modelos de base de datos', 8),
(1, 'Coordinacion/Planificacion', 'Reunion de equipo para definir arquitectura', 2),
(2, 'Diseño/Desarrollo de Software', 'Implementación de servicios REST para login', 12),
(2, 'Reuniones con cliente', 'Presentacion de maquetas iniciales', 3),
(3, 'Reuniones con cliente', 'Sincronización de requerimientos tecnicos', 2),
(3, 'Diseño/Desarrollo de Software', 'Debug de errores en autenticación JWT', 10),
(3, 'Pruebas/QA', 'Test de integracion de servicios', 4);

-- Maria Gomez (ID 4 al 5)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(4, 'Coordinacion/Planificacion', 'Carta Gantt inicial y definicion de hitos', 6),
(5, 'Documentacion', 'Manual de usuario v1 y documentacion de API', 10),
(5, 'Diseño/Desarrollo de Software', 'Ajustes en el esquema de la base de datos', 4);

-- Diego Torres (ID 6 al 7)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(6, 'Instalaciones/Despliegue', 'Setup de entorno en servidor AWS EC2', 12),
(7, 'Diseño/Desarrollo de Software', 'Creacion de controladores base', 8),
(7, 'Coordinacion/Planificacion', 'Coordinacion de tareas de la proxima semana', 2);

-- Carla Rojas (ID 8 al 9)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(8, 'Diseño/Desarrollo de Software', 'Maquetación inicial del dashboard', 15),
(8, 'Pruebas/QA', 'Unit tests de componentes de navegacion', 3),
(9, 'Pruebas/QA', 'Test de componentes UI finales', 5),
(9, 'Diseño/Desarrollo de Software', 'Integración con pasarela de pagos Stripe', 12),
(9, 'Documentacion', 'Documentacion de flujos de pago', 3);

-- Nicolas Soto (ID 10)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(10, 'Diseño/Desarrollo de Software', 'Backend de autenticación y autorizacion', 20),
(10, 'Reuniones con cliente', 'Feedback sobre el modulo de seguridad', 2);

-- 8. Actividades Planeadas (Advance Future)
INSERT INTO advance_future (id_advance, type_advance) VALUES 
(1, 'Diseño/Desarrollo de Software'), (1, 'Reuniones con cliente'),
(2, 'Diseño/Desarrollo de Software'), (2, 'Pruebas/QA'), (2, 'Documentacion'),
(3, 'Pruebas/QA'), (3, 'Instalaciones/Despliegue'),
(4, 'Diseño/Desarrollo de Software'),
(5, 'Documentacion'), (5, 'Entrega/Capacitacion'),
(6, 'Reuniones con cliente'), (6, 'Diseño/Desarrollo de Software'),
(7, 'Diseño/Desarrollo de Software'),
(8, 'Pruebas/QA'), (8, 'Documentacion'),
(9, 'Entrega/Capacitacion'), (9, 'Documentacion'),
(10, 'Instalaciones/Despliegue'), (10, 'Pruebas/QA'), (10, 'Reuniones con cliente');
