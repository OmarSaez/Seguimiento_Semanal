-- Script para creación de tablas en PostgreSQL
-- Proyecto: Seguimiento Semanal

-- Tabla: teacher
CREATE TABLE teacher (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Tabla: section
CREATE TABLE section (
    id SERIAL PRIMARY KEY,
    section_code VARCHAR(255) NOT NULL,
    semester INTEGER NOT NULL,
    year INTEGER NOT NULL,
    id_teacher INTEGER NOT NULL,
    is_active BOOLEAN,
    CONSTRAINT fk_teacher FOREIGN KEY (id_teacher) REFERENCES teacher(id)
);

-- Tabla: proyect
CREATE TABLE proyect (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    id_section INTEGER NOT NULL,
    CONSTRAINT fk_section FOREIGN KEY (id_section) REFERENCES section(id)
);

-- Tabla: student
CREATE TABLE student (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    id_section INTEGER NOT NULL,
    CONSTRAINT fk_section_student FOREIGN KEY (id_section) REFERENCES section(id)
);

-- Tabla: advance
CREATE TABLE advance (
    id SERIAL PRIMARY KEY,
    id_student INTEGER NOT NULL, -- Corregido: id_student
    id_proyect INTEGER NOT NULL,
    send_date TIMESTAMP,
    number_week INTEGER,
    problem TEXT,
    CONSTRAINT fk_student FOREIGN KEY (id_student) REFERENCES student(id),
    CONSTRAINT fk_proyect FOREIGN KEY (id_proyect) REFERENCES proyect(id)
);

-- Tabla: advance_detail
CREATE TABLE advance_detail (
    id SERIAL PRIMARY KEY,
    id_advance INTEGER NOT NULL,
    type_advance VARCHAR(255) NOT NULL,
    context TEXT,
    hh INTEGER,
    CONSTRAINT fk_advance FOREIGN KEY (id_advance) REFERENCES advance(id)
);
