-- Script de Poblado (MÁXIMA ROBUSTEZ ANALÍTICA Y REALISMO DE CONTEXTO)
-- Uso: Ejecutar TODO el script de una vez.

-- 1. Limpieza total
TRUNCATE TABLE teacher, section, proyect, student, advance, advance_detail, advance_future RESTART IDENTITY CASCADE;

-- 2. Profesores (Pass literal test1234)
INSERT INTO teacher (name, email, password) VALUES 
('Omar Saez', 'omar.saez@usach.cl', 'test1234'),
('Alvaro Yañez', 'alvaro.yanez@usach.cl', 'test1234');

-- 3. Secciones
INSERT INTO section (section_code, semester, year, id_teacher, is_active, start_date, finish_date) VALUES 
('INF-612-O', 1, 2026, 1, true, '2026-03-30', '2026-08-14'), -- Semana Actual: 3
('INF-612-A', 1, 2026, 2, true, '2026-03-30', '2026-08-14');

-- 4. Proyectos
INSERT INTO proyect (name, code, id_section) VALUES 
('Frutos Secos Mil Sabores', 'P03', 1),
('Marroquineria Balta', 'P08', 1),
('SGT HUAP', 'P13', 1);

-- 5. Estudiantes (11 en Seccion 1)
INSERT INTO student (email, name, lastname, id_section) VALUES 
('juan.perez@usach.cl', 'Juan', 'Perez', 1),         -- ID 1
('pedro.armas@usach.cl', 'Pedro', 'Armas', 1),       -- ID 2
('andres.vera@usach.cl', 'Andres', 'Vera', 1),       -- ID 3 (GHOST)
('maria.gomez@usach.cl', 'Maria', 'Gomez', 1),       -- ID 4
('raul.pino@usach.cl', 'Raul', 'Pino', 1),           -- ID 5
('ana.luz@usach.cl', 'Ana', 'Luz', 1),               -- ID 6 (GHOST)
('elena.rivas@usach.cl', 'Elena', 'Rivas', 1),       -- ID 7
('diego.torres@usach.cl', 'Diego', 'Torres', 1),     -- ID 8
('sofia.mar@usach.cl', 'Sofia', 'Mar', 1),           -- ID 9
('lucas.ver@usach.cl', 'Lucas', 'Ver', 1),           -- ID 10
('felipe.solis@usach.cl', 'Felipe', 'Solis', 1);     -- ID 11

-- 6. Avances (ID 1-19)
-- Juan (1, 2, 3)
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(1, 1, '2026-04-05 10:00:00', 1, 'Ninguno'), -- 1
(1, 1, '2026-04-12 11:00:00', 2, 'Ninguno'), -- 2
(1, 1, '2026-04-16 09:00:00', 3, 'Ninguno'); -- 3

-- Pedro (4, 5) - Batch de 2
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(2, 1, '2026-04-16 14:00:00', 1, 'Ninguno'), -- 4
(2, 1, '2026-04-16 14:05:00', 2, 'Ninguno'); -- 5

-- Maria (6, 7) - Cumple 50%
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(4, 2, '2026-04-06 15:00:00', 1, 'Ninguno'), -- 6
(4, 2, '2026-04-13 16:00:00', 2, 'Ninguno'); -- 7

-- Raul (8, 9) - Mentiroso 0%
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(5, 2, '2026-04-05 18:00:00', 1, 'Ninguno'), -- 8
(5, 2, '2026-04-13 10:00:00', 2, 'Ninguno'); -- 9

-- Elena (10) - Retraso 2 sem
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(7, 2, '2026-04-07 09:00:00', 1, 'El cliente canceló la reunión a último minuto por una emergencia, lo que retrasó el levantamiento de requerimientos.'); -- 10

-- Diego (11, 12, 13)
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(8, 3, '2026-04-05 20:00:00', 1, 'Ninguno'), -- 11
(8, 3, '2026-04-12 18:00:00', 2, 'Problemas de configuración con el entorno de la base de datos local y dependencias de la versión del motor de BDD.'), -- 12
(8, 3, '2026-04-16 08:30:00', 3, 'Ninguno'); -- 13

-- Sofia (14, 15)
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(9, 3, '2026-04-06 12:00:00', 1, 'Dificultades técnicas entendiendo el stack de frontend, hemos tenido un inicio lento.'), -- 14
(9, 3, '2026-04-14 11:00:00', 2, 'Ninguno'); -- 15

-- Lucas (16, 17, 18) - SUPER BATCH de 3
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(10, 3, '2026-04-16 17:00:00', 1, 'Ninguno'), -- 16
(10, 3, '2026-04-16 17:01:00', 2, 'Ninguno'), -- 17
(10, 3, '2026-04-16 17:02:00', 3, 'Ninguno'); -- 18

-- Felipe (19) - Retraso 2 sem
INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem) VALUES 
(11, 3, '2026-04-05 23:00:00', 1, 'Licencia médica por influenza durante toda la semana, no pude conectarme a trabajar.'); -- 19


-- 7. Detalles (Más robustos y con más variedad de actividades por semana)
-- Juan (Champion)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(1, 'Coordinacion/Planificacion', 'Coordinación inicial con el equipo mediante videollamada para establecer roles, plan de trabajo y horarios disponibles.', 2),
(1, 'Diseño/Desarrollo de Software', 'Creación del diagrama de arquitectura general del backend y frontend de manera inicial.', 4),
(1, 'Diseño/Desarrollo de Software', 'Implementación de la estructura base del proyecto Spring Boot y primeros DTOs de autenticación.', 6),
(2, 'Diseño/Desarrollo de Software', 'Conexión de la API con la base de datos PostgreSQL utilizando Spring Data JPA y validación de propiedades.', 5),
(2, 'Coordinacion/Planificacion', 'Reunión de coordinación interna para revisar el estado del avance y planificar los próximos días.', 3),
(3, 'Documentacion', 'Redacción de la primera iteración del manual técnico de la API utilizando Swagger UI y JSDoc.', 4),
(3, 'Diseño/Desarrollo de Software', 'Corrección de vulnerabilidades descubiertas en los endpoints, mejorando el cifrado de las contraseñas guardadas.', 4);

-- Pedro (Batcher)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(4, 'Coordinacion/Planificacion', 'Lectura a fondo de los requerimientos entregados por el socio comunitario y separación en tickets de Jira.', 3),
(5, 'Diseño/Desarrollo de Software', 'Creación de todos los modelos de dominio (entidades) según el modelo relacional (DER).', 8),
(5, 'Reuniones con cliente', 'Breve reunión de avance con el socio para resolver dudas sobre el alcance del módulo de usuarios.', 1);

-- Maria (Cumple a medias)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(6, 'Coordinacion/Planificacion', 'Elaboración de la Carta Gantt semestral planificando los sprints de 2 semanas de duración cada uno.', 3),
(6, 'Reuniones con cliente', 'Entrevista inicial (levantamiento de requerimientos funcionales) con el dueño de Marroquineria Balta.', 2),
(7, 'Diseño/Desarrollo de Software', 'Maquetación e implementación de componentes funcionales en la pantalla de inicio usando React y CSS Modules.', 6),
(7, 'Diseño/Desarrollo de Software', 'Prototipado rápido en Figma para la vista de listado de productos de marroquinería.', 4);

-- Raul (El Mentiroso)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(8, 'Coordinacion/Planificacion', 'Configuración del repositorio remoto en GitHub, creación de ramas requeridas e invitación a los miembros del equipo.', 2),
(9, 'Reuniones con cliente', 'Reunión extensa con el equipo y el profesor para revisar los problemas de por qué el equipo no ha avanzado.', 4);

-- Elena (S1 Retraso 2 sem)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(10, 'Reuniones con cliente', 'Espera de casi una hora al cliente en la ubicación acordada, lamentablemente el cliente no apareció (emergencia).', 2),
(10, 'Diseño/Desarrollo de Software', 'Para compensar el tiempo, realicé avance individual leyendo la documentación de buenas prácticas de React.', 3);

-- Diego (Al Dia)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(11, 'Coordinacion/Planificacion', 'Definición de las tecnologías a utilizar y creación de un documento justificando el uso del Stack.', 2),
(11, 'Diseño/Desarrollo de Software', 'Modelado completo de la base de datos relacional (DER) utilizando la plataforma draw.io.', 4),
(11, 'Diseño/Desarrollo de Software', 'Desarrollo de las sentencias SQL locales para la estructura del esquema inicial de la base de datos.', 3),
(12, 'Diseño/Desarrollo de Software', 'Solución de problemas graves con la configuración y el driver de conexión de base de datos a nivel local.', 5),
(12, 'Pruebas/QA', 'Creación de un script en Python para inyección y prueba masiva de datos en la base de datos local.', 2),
(13, 'Documentacion', 'Actualización profunda de la Wiki del proyecto, añadiendo una sección de pasos para conectarse correctamente a la BD.', 3),
(13, 'Diseño/Desarrollo de Software', 'Diseño e implementación de la primera capa de Servicios inyectables a los controladores REST.', 6);

-- Sofia (Retraso 1 sem)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(14, 'Coordinacion/Planificacion', 'Reunión de coordinación interna para organizar las tareas que no se lograron iniciar debido a bloqueos iniciales.', 2),
(14, 'Diseño/Desarrollo de Software', 'Múltiples intentos para levantar y compilar correctamente el proyecto esqueleto usando Vite y depuración de errores mostrados.', 4),
(15, 'Diseño/Desarrollo de Software', 'Codificación orientada a componentes de interfaz de usuario de uso general (Tarjetas, Botones universales y Encabezado principal).', 5),
(15, 'Diseño/Desarrollo de Software', 'Definición de las constantes de colores base corporativos usando variables CSS y un archivo central global.', 2);

-- Lucas (Súper Batcher)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(16, 'Coordinacion/Planificacion', 'Revisión exhaustiva de la documentación técnica y del modelo de negocio entregado por el Centro Emprendedor Colina.', 3),
(17, 'Diseño/Desarrollo de Software', 'Bocetos, wireframing de baja resolución y mapas mentales para organizar cómo el usuario final navegará en la aplicación web.', 4),
(18, 'Diseño/Desarrollo de Software', 'Implementación de la navegación base (routing) centralizada entre componentes usando la librería React Router DOM v6.', 5);

-- Felipe (Retraso 2 sem - Enfermo)
INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES 
(19, 'Coordinacion/Planificacion', 'Preparación en un documento de las preguntas más críticas a realizar en la futura entrevista de requerimientos al socio.', 2);


-- 8. Futuros (LAS PROMESAS QUE ALIMENTAN EL KPI)
-- Juan S1 promises QA and DB logic for S2 -> Did both
INSERT INTO advance_future (id_advance, type_advance) VALUES (1, 'Pruebas/QA'); 
INSERT INTO advance_future (id_advance, type_advance) VALUES (1, 'Diseño/Desarrollo de Software');

-- Juan S2 promises Doc for S3 -> Did Doc (Also did extra SW design, so still 100% promised fulfillment)
INSERT INTO advance_future (id_advance, type_advance) VALUES (2, 'Documentacion'); 

-- Pedro S1 promises Desarrollo and Reuniones for S2 -> Did both
INSERT INTO advance_future (id_advance, type_advance) VALUES (4, 'Diseño/Desarrollo de Software');
INSERT INTO advance_future (id_advance, type_advance) VALUES (4, 'Reuniones con cliente');

-- Maria S1 promises Desarrollo and QA for S2 -> Did Desarrollo but NO QA (A medias, 50% fulfillment)
INSERT INTO advance_future (id_advance, type_advance) VALUES (6, 'Diseño/Desarrollo de Software'); 
INSERT INTO advance_future (id_advance, type_advance) VALUES (6, 'Pruebas/QA'); 

-- Raul S1 promises Desarrollo for S2 -> Did Reuniones (Mentiroso, 0% fulfillment)
INSERT INTO advance_future (id_advance, type_advance) VALUES (8, 'Diseño/Desarrollo de Software');

-- Diego S1 promises Desarrollo and QA for S2 -> Did both
INSERT INTO advance_future (id_advance, type_advance) VALUES (11, 'Diseño/Desarrollo de Software'); 
INSERT INTO advance_future (id_advance, type_advance) VALUES (11, 'Pruebas/QA'); 

-- Diego S2 promises Doc and Desarrollo for S3 -> Did both
INSERT INTO advance_future (id_advance, type_advance) VALUES (12, 'Documentacion');
INSERT INTO advance_future (id_advance, type_advance) VALUES (12, 'Diseño/Desarrollo de Software');

-- Sofia S1 promises Desarrollo for S2 -> Did Desarrollo
INSERT INTO advance_future (id_advance, type_advance) VALUES (14, 'Diseño/Desarrollo de Software'); 

-- Lucas S1 promises Desarrollo for S2 -> Did Desarrollo
INSERT INTO advance_future (id_advance, type_advance) VALUES (16, 'Diseño/Desarrollo de Software'); 
-- Lucas S2 promises Desarrollo for S3 -> Did Desarrollo
INSERT INTO advance_future (id_advance, type_advance) VALUES (17, 'Diseño/Desarrollo de Software');
