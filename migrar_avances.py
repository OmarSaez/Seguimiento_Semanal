#!/usr/bin/env python3
import csv
import re
import sys
from datetime import datetime
import psycopg2
from psycopg2 import extras

# === CONFIGURACIÓN DE LA BASE DE DATOS ===
# Cambia estas credenciales por las de tu base de datos de producción/MV si es necesario.
DB_PARAMS = {
    "host": "localhost",
    "port": 5432,
    "database": "avance_semanal",
    "user": "postgres",
    "password": "postgres"
}

CSV_FILE = "Repo Avance Semanal PINGESO 2026-1 - Secc A (respuestas) - Respuestas de formulario 1(1).csv"

# Parámetros solicitados para la sección
DEFAULT_SECTION_CODE = "2026-1 seccion-A"
DEFAULT_SECTION_NAME = "2026-1 Sección A"
DEFAULT_SECTION_START = "2026-03-29"

# === MAPEO DE TIPOS DE ACTIVIDAD ===
ACTIVITY_MAPPING = {
    "Coord": "Coordinacion/Planificacion",
    "Reu.Cliente": "Reuniones con cliente",
    "Desarr. SW": "Diseño/Desarrollo de Software",
    "Instal/Deploy": "Instalaciones/Despliegue",
    "Pruebas/QA": "Pruebas/QA",
    "Docum.": "Documentacion",
    "Entrega": "Entrega/Capacitacion",
    "Otros": "Otros"
}

FUTURE_ACTIVITY_MAP = {
    "1. Coord/Planificación": "Coordinacion/Planificacion",
    "2. Reuniones c/Cliente": "Reuniones con cliente",
    "3. Diseño/Desarr SW": "Diseño/Desarrollo de Software",
    "4. Instalac/Despliegue": "Instalaciones/Despliegue",
    "5. Pruebas/QA": "Pruebas/QA",
    "6. Documentación": "Documentacion",
    "7. Entrega/Capacit": "Entrega/Capacitacion",
    "7. Entrega/Capacitación": "Entrega/Capacitacion"
}

def clean_text(text):
    if not text:
        return 'n/r'
    text = text.strip()
    lower_t = text.lower()
    if lower_t in ['', 'ninguno', 'ninguno.', 'no', 'no hay', 'no hay.', 'ninguno por ahora', 'ninguno por ahora.', '-', 'n/a', 'no aplica']:
        return 'n/r'
    return text[:256] # Limitar a la longitud del varchar de la BD

def get_week_number(date_str):
    # Corregir años erróneos (ej. 2025 -> 2026)
    date_str = date_str.replace("2025", "2026").strip()
    try:
        dt = datetime.strptime(date_str, "%d/%m/%Y")
    except ValueError:
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return 1
            
    # Lunes de la Semana 1 comienza el 29/03/2026
    start_date = datetime(2026, 3, 29)
    delta = dt - start_date
    week = (delta.days // 7) + 1
    return max(1, week)

def parse_project_code_and_name(proj_str):
    match = re.match(r"^(P\d+)\s*-\s*(.*)$", proj_str.strip())
    if match:
        return match.group(1), match.group(2)
    return "P99", proj_str.strip()

def run_migration():
    print(f"[*] Iniciando migración desde: {CSV_FILE}")
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor(cursor_factory=extras.DictCursor)
        print("[+] Conexión a la base de datos establecida.")
    except Exception as e:
        print(f"[-] Error de conexión: {e}")
        sys.exit(1)

    # 1. Obtener o crear Sección por defecto con parámetros solicitados
    cur.execute("SELECT id FROM section WHERE section_code = %s LIMIT 1", (DEFAULT_SECTION_CODE,))
    sec_row = cur.fetchone()
    if sec_row:
        section_id = sec_row['id']
        print(f"[+] Sección existente encontrada con ID: {section_id}")
    else:
        print(f"[*] Creando nueva sección '{DEFAULT_SECTION_CODE}'")
        cur.execute(
            "INSERT INTO section (section_code, start_date, finish_date, id_teacher, semester, year, is_active) VALUES (%s, %s, NULL, NULL, 1, 2026, True) RETURNING id",
            (DEFAULT_SECTION_CODE, DEFAULT_SECTION_START)
        )
        section_id = cur.fetchone()['id']

    # Contadores de control
    advances_imported = 0
    students_created = 0
    projects_created = 0
    
    # Nuevos contadores detallados
    total_rows_analyzed = 0
    errors_encountered = 0
    advances_skipped = 0
    unique_students = set()
    unique_projects = set()

    with open(CSV_FILE, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader) # Cabecera

        for row_idx, row in enumerate(reader, start=2):
            total_rows_analyzed += 1
            if not row or len(row) < 5:
                errors_encountered += 1
                continue

            timestamp_str = row[0]
            email = row[1].strip().lower()
            proj_raw = row[2]
            week_raw = row[3]
            
            if not email:
                errors_encountered += 1
                continue

            unique_students.add(email)

            # Parsear datos del proyecto
            proj_code, proj_name = parse_project_code_and_name(proj_raw)
            unique_projects.add(proj_code)

            # 2. Buscar o crear Proyecto
            cur.execute("SELECT id FROM proyect WHERE code = %s LIMIT 1", (proj_code,))
            proj_row = cur.fetchone()
            if proj_row:
                proyect_id = proj_row['id']
            else:
                cur.execute(
                    "INSERT INTO proyect (code, name, id_section) VALUES (%s, %s, %s) RETURNING id",
                    (proj_code, proj_name, section_id)
                )
                proyect_id = cur.fetchone()['id']
                projects_created += 1
                print(f"[+] Proyecto creado automáticamente: {proj_code} - {proj_name}")

            # 3. Buscar o crear Estudiante
            cur.execute("SELECT id FROM student WHERE email = %s LIMIT 1", (email,))
            stu_row = cur.fetchone()
            if stu_row:
                student_id = stu_row['id']
            else:
                # Extraer nombre a partir del email
                parts = email.split('@')[0].split('.')
                name = parts[0].capitalize()
                lastname = parts[1].capitalize() if len(parts) > 1 else "Estudiante"
                
                cur.execute(
                    "INSERT INTO student (email, name, lastname, id_section, id_proyect) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (email, name, lastname, section_id, proyect_id)
                )
                student_id = cur.fetchone()['id']
                students_created += 1
                print(f"[+] Estudiante creado automáticamente: {name} {lastname} ({email})")

            # 4. Determinar Semana y parsear timestamp
            week_number = get_week_number(week_raw)
            try:
                send_date = datetime.strptime(timestamp_str, "%d/%m/%Y %H:%M:%S")
            except ValueError:
                try:
                    send_date = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    send_date = datetime.now()

            # Evitar Duplicidad: Si ya existe un avance para esta semana y alumno, lo saltamos para no sobreescribir datos actuales
            cur.execute(
                "SELECT id FROM advance WHERE id_student = %s AND number_week = %s",
                (student_id, week_number)
            )
            existing_advances = cur.fetchall()
            if existing_advances:
                print(f"[*] Saltando avance ya existente de {email} para la semana {week_number}")
                advances_skipped += 1
                continue

            # 5. Insertar Avance
            problem = clean_text(row[21])
            solution = 'n/r' # Columna no disponible en este formulario
            
            cur.execute(
                "INSERT INTO advance (id_student, id_proyect, send_date, number_week, problem, solution) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (student_id, proyect_id, send_date, week_number, problem, solution)
            )
            advance_id = cur.fetchone()['id']

            # 6. Insertar Detalles de Horas y Logros (Columnas 5 a 20)
            # Indice de mapeo de actividades realizadas
            # Coord: col 5 (horas) y col 6 (logros)
            # Reu.Cliente: col 7 (horas) y col 8 (logros)
            # Desarr. SW: col 9 (horas) y col 10 (logros)
            # Instal/Deploy: col 11 (horas) y col 12 (logros)
            # Pruebas/QA: col 13 (horas) y col 14 (logros)
            # Docum.: col 15 (horas) y col 16 (logros)
            # Entrega: col 17 (horas) y col 18 (logros)
            # Otros: col 19 (horas) y col 20 (logros)
            
            activities = [
                ("Coord", 5, 6),
                ("Reu.Cliente", 7, 8),
                ("Desarr. SW", 9, 10),
                ("Instal/Deploy", 11, 12),
                ("Pruebas/QA", 13, 14),
                ("Docum.", 15, 16),
                ("Entrega", 17, 18),
                ("Otros", 19, 20)
            ]

            for act_key, hh_idx, ctx_idx in activities:
                hh_val_str = row[hh_idx].replace(',', '.').strip()
                ctx_val = clean_text(row[ctx_idx])
                
                hh = 0.0
                if hh_val_str:
                    try:
                        hh = float(hh_val_str)
                    except ValueError:
                        pass
                
                # Insertamos si hay horas registradas o logros descritos
                if hh > 0 or (ctx_val != 'n/r'):
                    type_str = ACTIVITY_MAPPING[act_key]
                    cur.execute(
                        "INSERT INTO advance_detail (id_advance, type_advance, context, hh) VALUES (%s, %s, %s, %s)",
                        (advance_id, type_str, ctx_val, hh)
                    )

            # 7. Insertar Compromisos Futuros (Columnas 23 y 24)
            future_types_raw = row[23]

            if future_types_raw:
                # Puede contener múltiples actividades separadas por coma
                future_parts = [p.strip() for p in future_types_raw.split(',')]
                for part in future_parts:
                    mapped_type = FUTURE_ACTIVITY_MAP.get(part, "Otros")
                    # El context de advance_future se guarda como 'n/r'
                    cur.execute(
                        "INSERT INTO advance_future (id_advance, type_advance, context) VALUES (%s, %s, %s)",
                        (advance_id, mapped_type, 'n/r')
                    )

            advances_imported += 1

    conn.commit()
    cur.close()
    conn.close()

    print("\n" + "="*50)
    print("               RESULTADO DE MIGRACIÓN")
    print("="*50)
    print(f"[i] Total de filas analizadas en CSV: {total_rows_analyzed}")
    print(f"[i] Total de estudiantes únicos en CSV: {len(unique_students)}")
    print(f"[i] Total de proyectos únicos en CSV: {len(unique_projects)}")
    print(f"[-] Filas con errores/vacías omitidas: {errors_encountered}")
    print(f"[*] Reportes ya existentes (omitidos): {advances_skipped}")
    print(f"[+] Reportes NUEVOS importados con éxito: {advances_imported}")
    print("-" * 50)
    print(f"[+] Nuevos registros de estudiantes en BD: {students_created}")
    print(f"[+] Nuevos registros de proyectos en BD: {projects_created}")
    print("="*50)

if __name__ == "__main__":
    run_migration()
