package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.repository.StudentRepository;
import com.seguimiento.semanal.repository.AdvanceRepository;
import com.seguimiento.semanal.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para la gestión de estudiantes.
 * El Profesor/Admin es el encargado de agregar y gestionar a los alumnos en las secciones.
 */
@Service
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HELPER')")
public class StudentService {

    private final StudentRepository studentRepository;
    private final AdvanceRepository advanceRepository;
    private final SectionRepository sectionRepository;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public Optional<Student> findById(Long id) {
        return studentRepository.findById(id);
    }

    public List<Student> findBySectionId(Long sectionId) {
        return studentRepository.findBySectionId(sectionId);
    }

    public Student save(Student student) {
        checkSectionActiveForHelper(student.getSection());
        validateEmail(student.getEmail());
        // Verificar duplicados para evitar registros duplicados con el mismo correo
        List<Student> existing = studentRepository.findByEmail(student.getEmail().trim().toLowerCase());
        if (!existing.isEmpty()) {
            throw new IllegalArgumentException("Ya existe un estudiante registrado con el correo " + student.getEmail());
        }
        student.setEmail(student.getEmail().trim().toLowerCase());
        return studentRepository.save(student);
    }

    public Student update(Long id, Student student) {
        checkSectionActiveForHelper(student.getSection());
        if (!studentRepository.existsById(id)) {
            throw new RuntimeException("Estudiante no encontrado");
        }
        validateEmail(student.getEmail());
        student.setId(id);
        student.setEmail(student.getEmail().trim().toLowerCase());
        return studentRepository.save(student);
    }

    private void checkSectionActiveForHelper(com.seguimiento.semanal.entity.Section section) {
        if (section == null || section.getId() == null) return;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            boolean isHelper = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_HELPER"));
            if (isHelper) {
                com.seguimiento.semanal.entity.Section sec = sectionRepository.findById(section.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada"));
                if (sec.getIsActive() == null || !sec.getIsActive()) {
                    throw new org.springframework.security.access.AccessDeniedException("Acción denegada: La sección no está activa.");
                }
            }
        }
    }

    private void validateEmail(String email) {
        if (email == null || !email.toLowerCase().endsWith("@usach.cl")) {
            throw new IllegalArgumentException("El correo debe pertenecer a la institución (@usach.cl)");
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(Long id) {
        studentRepository.deleteById(id);
    }

    public java.util.Map<String, Object> checkStudent(String email, Long currentSectionId) {
        List<Student> students = studentRepository.findByEmail(email.trim().toLowerCase());
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        
        if (students.isEmpty()) {
            result.put("exists", false);
            return result;
        }
        
        Student student = students.get(0);
        result.put("exists", true);
        result.put("student", student);
        
        if (student.getSection() != null) {
            result.put("inCurrentSection", currentSectionId != null && student.getSection().getId().equals(currentSectionId));
            result.put("sectionId", student.getSection().getId());
            result.put("sectionCode", student.getSection().getSectionCode());
            result.put("sectionActive", isSectionActiveChecked(student.getSection()));
        } else {
            result.put("inCurrentSection", false);
            result.put("sectionActive", false);
        }
        
        return result;
    }

    @org.springframework.transaction.annotation.Transactional
    public void transferStudent(String email, Long targetSectionId) {
        List<Student> students = studentRepository.findByEmail(email.trim().toLowerCase());
        if (students.isEmpty()) {
            throw new IllegalArgumentException("El estudiante no existe");
        }
        
        com.seguimiento.semanal.entity.Section targetSection = sectionRepository.findById(targetSectionId)
                .orElseThrow(() -> new IllegalArgumentException("La sección de destino no existe"));
        
        checkSectionActiveForHelper(targetSection);
        
        Student student = students.get(0);
        
        // NO ELIMINAMOS los reportes anteriores, se conservan intactos en la base de datos como historial
        
        // 1. Limpiar proyecto asignado (ya que pertenece a la sección anterior)
        student.setProyect(null);
        
        // 2. Cambiar de sección
        student.setSection(targetSection);
        
        studentRepository.save(student);
    }

    @org.springframework.transaction.annotation.Transactional
    public void transferStudents(List<String> emails, Long targetSectionId) {
        for (String email : emails) {
            transferStudent(email, targetSectionId);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void resolveConflicts(Long targetSectionId, List<java.util.Map<String, Object>> resolutions) {
        com.seguimiento.semanal.entity.Section targetSection = sectionRepository.findById(targetSectionId)
                .orElseThrow(() -> new IllegalArgumentException("La sección no existe"));

        checkSectionActiveForHelper(targetSection);

        for (java.util.Map<String, Object> res : resolutions) {
            String email = (String) res.get("email");
            String action = (String) res.get("action");
            String name = (String) res.get("name");
            String lastname = (String) res.get("lastname");

            if (email == null || action == null) continue;

            if ("replace".equalsIgnoreCase(action)) {
                List<Student> students = studentRepository.findByEmail(email.trim().toLowerCase());
                if (!students.isEmpty()) {
                    Student student = students.get(0);
                    
                    // Si se cambia de sección, trasladamos preservando historial
                    if (student.getSection() == null || !student.getSection().getId().equals(targetSectionId)) {
                        student.setSection(targetSection);
                        student.setProyect(null); // Limpiar proyecto anterior
                    }
                    
                    // Actualizar nombre y apellido con los datos sugeridos/ingresados
                    if (name != null && !name.trim().isEmpty()) {
                        student.setName(name.trim());
                    }
                    if (lastname != null && !lastname.trim().isEmpty()) {
                        student.setLastname(lastname.trim());
                    }
                    
                    studentRepository.save(student);
                }
            }
        }
    }

    public java.util.Map<String, Object> uploadStudentsFromExcel(Long sectionId, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        com.seguimiento.semanal.entity.Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("La sección no existe"));

        checkSectionActiveForHelper(section);

        int processed = 0;
        int total = 0;
        java.util.List<java.util.Map<String, Object>> conflicts = new java.util.ArrayList<>();
        java.util.List<String> invalidEmails = new java.util.ArrayList<>();
        java.util.List<String> processedEmails = new java.util.ArrayList<>();

        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(file.getInputStream())) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            for (org.apache.poi.ss.usermodel.Row row : sheet) {
                org.apache.poi.ss.usermodel.Cell cell = row.getCell(0, org.apache.poi.ss.usermodel.Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                String email = cell.getStringCellValue().trim();
                
                if (email.isEmpty()) {
                    continue; // Skip empty rows
                }

                if (!email.contains("@")) {
                    continue; // Skip headers or non-email text
                }

                total++;

                if (!email.toLowerCase().endsWith("@usach.cl")) {
                    invalidEmails.add(email);
                    continue;
                }

                List<Student> existingStudents = studentRepository.findByEmail(email.toLowerCase());
                
                // Sugerir nombre y apellido desde el formato del correo
                String[] parts = email.split("@")[0].split("\\.");
                String suggestedName = parts.length > 0 ? capitalize(parts[0]) : "Desconocido";
                String suggestedLastname = parts.length > 1 ? capitalize(parts[1]) : "Desconocido";

                if (!existingStudents.isEmpty()) {
                    Student existing = existingStudents.get(0);
                    
                    // Alumno repetido en el sistema (misma sección o en otra)
                    java.util.Map<String, Object> conflict = new java.util.HashMap<>();
                    conflict.put("email", existing.getEmail());
                    conflict.put("name", existing.getName());
                    conflict.put("lastname", existing.getLastname());
                    conflict.put("suggestedName", suggestedName);
                    conflict.put("suggestedLastname", suggestedLastname);
                    
                    boolean isSame = existing.getSection() != null && existing.getSection().getId().equals(sectionId);
                    conflict.put("isSameSection", isSame);
                    
                    if (existing.getSection() != null) {
                        conflict.put("currentSectionId", existing.getSection().getId());
                        conflict.put("currentSectionCode", existing.getSection().getSectionCode());
                        conflict.put("sectionActive", isSectionActiveChecked(existing.getSection()));
                    } else {
                        conflict.put("currentSectionId", null);
                        conflict.put("currentSectionCode", "Sin Sección");
                        conflict.put("sectionActive", false);
                    }
                    conflicts.add(conflict);
                    continue;
                }

                Student student = new Student();
                student.setEmail(email.toLowerCase());
                student.setName(suggestedName);
                student.setLastname(suggestedLastname);
                student.setSection(section);
                
                studentRepository.save(student);
                processedEmails.add(student.getEmail());
                processed++;
            }
        }
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("processed", processed);
        result.put("total", total);
        result.put("conflicts", conflicts);
        result.put("invalidEmails", invalidEmails);
        result.put("processedEmails", processedEmails);
        
        StringBuilder msg = new StringBuilder();
        msg.append("Se procesaron con éxito ").append(processed).append(" de ").append(total).append(" alumnos.");
        if (!conflicts.isEmpty()) {
            msg.append(" Se detectaron ").append(conflicts.size()).append(" alumnos repetidos.");
        }
        if (!invalidEmails.isEmpty()) {
            msg.append(" ").append(invalidEmails.size()).append(" correos no institucional o con error de formato no se cargaron.");
        }
        result.put("message", msg.toString());
        return result;
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    private boolean isSectionActiveChecked(com.seguimiento.semanal.entity.Section section) {
        if (section == null) return false;
        if (section.getIsActive() == null || !section.getIsActive()) {
            return false;
        }
        java.time.LocalDate now = java.time.LocalDate.now();
        java.time.LocalDate limitDate = null;
        if (section.getFinishDate() != null) {
            limitDate = section.getFinishDate().plusMonths(1).plusDays(5);
        } else if (section.getStartDate() != null) {
            limitDate = section.getStartDate().plusWeeks(22);
        }
        
        if (limitDate != null && (now.isAfter(limitDate) || now.isEqual(limitDate))) {
            section.setIsActive(false);
            sectionRepository.save(section);
            return false;
        }
        return true;
    }
}
