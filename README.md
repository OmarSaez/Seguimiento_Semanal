# Seguimiento Semanal

Plataforma web diseñada para la gestión y seguimiento del progreso académico en el ramo de **Proyecto de Ingenieria en Software (PINGESO)**.

Este sistema permite a los docentes llevar un control detallado de los avances semanales de los estudiantes, facilitando la supervisión del cumplimiento de objetivos y la identificación temprana de dificultades.

## 🚀 Características Principales

### Para Docentes (Administradores)
*   **Gestión de Secciones**: Creación y administración de cursos o secciones académicas.
*   **Control de Alumnos**: Administración de estudiantes matriculados en cada sección.
*   **Reportes Detallados**: Visualización cronológica de todos los avances enviados por los estudiantes.
*   **Resumen por Proyecto**:
    *   Agrupación de avances por proyecto.
    *   Cálculo de horas humanas (HH) totales invertidas.
    *   **Gráficos Interactivos**: Visualización de la dedicación por semana mediante gráficos lineales.
*   **Analítica y Responsabilidad**:
    *   Cálculo de KPIs de cumplimiento y retraso.
    *   Identificación de entregas masivas ("entregas de golpe").
    *   Ratios de compromiso y alertas de estudiantes en riesgo.
*   **Horas por Actividad**:
    *   Desglose de horas dedicadas por tipo de tarea (Diseño, Testing, QA, etc.).
    *   Identificación de alumnos sin reporte.
*   **Exportación de Datos**: Generación de reportes completos en formato **Excel (.xlsx)** con múltiples hojas estructuradas.

### Para Estudiantes
*   **Registro de Avances**: Envío de reportes semanales detallando actividades realizadas.
*   **Seguimiento Individual**: Visualización del progreso personal a lo largo del semestre.
*   **Planificación Futura**: Registro de actividades planificadas para las próximas semanas.

## 🛠️ Stack Tecnológico

### Backend
*   **Lenguaje**: Java
*   **Framework**: Spring Boot
*   **Base de Datos**: PostgreSQL
*   **Seguridad**: Spring Security (JWT)
*   **Librería de Excel**: Apache POI

### Frontend
*   **Framework**: React
*   **Herramienta de Construcción**: Vite
*   **Estilos**: Tailwind CSS
*   **Librería de Gráficos**: Recharts

## 📂 Estructura del Proyecto

```
Seguimiento_Semanal/
├── backend/                # Lógica del servidor y API REST
│   ├── src/main/java/com/seguimiento/semanal/
│   │   ├── controller/     # Endpoints de la API
│   │   ├── entity/         # Modelos de la base de datos
│   │   ├── repository/     # Interfaces de acceso a datos
│   │   ├── service/        # Lógica de negocio y procesamiento
│   │   └── security/       # Configuración de autenticación y autorización
│   └── pom.xml             # Dependencias de Maven
│
├── frontend/               # Interfaz de usuario
│   ├── src/components/     # Componentes reutilizables
│   ├── src/pages/          # Páginas de la aplicación
│   ├── src/services/       # Llamadas a la API
│   ├── src/utils/          # Utilidades y helpers
│   ├── public/             # Archivos estáticos
│   └── vite.config.js      # Configuración de Vite
│
└── README.md               # Documentación del proyecto
```

### Versiones y Entorno (Tecnología Usada)

**Backend:**
*   Java: `v21` (JDK 21)
*   Spring Boot: `v3.2+` (Basado en el starter 4.0.5 local)
*   Apache POI: `v5.2.5` (Generación de hojas de cálculo)
*   PostgreSQL: `v14` o superior
*   Maven: `v3.6` o superior

**Frontend:**
*   Node.js: `v18` o superior
*   React: `v19.2.4`
*   Vite: `v8.0.4`
*   React Router DOM: `v7.14.1`
*   Axios: `v1.15.0`
*   Lucide React: `v1.8.0` (Iconografía)

## 🔐 Autenticación

El sistema utiliza autenticación basada en **JWT (JSON Web Tokens)**.

### Credenciales de Prueba
*   **Email**: [EMAIL_ADDRESS]`
*   **Contraseña**: `admin123`

## 📊 Exportación de Reportes

Los docentes pueden descargar reportes detallados en formato Excel desde la interfaz de usuario. Los reportes incluyen:
*   Reportes Detallados
*   Resumen por Proyecto
*   Analítica y Responsabilidad
*   Horas por Actividad

## 📄 Licencia

Este proyecto es de código cerrado y pertenece a sus respectivos autores.
