package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.repository.StudentRepository;
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
@PreAuthorize("hasRole('ADMIN')")
public class StudentService {

    private final StudentRepository studentRepository;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Optional<Student> findById(Long id) {
        return studentRepository.findById(id);
    }

    public List<Student> findBySectionId(Long sectionId) {
        return studentRepository.findBySectionId(sectionId);
    }

    public Student save(Student student) {
        return studentRepository.save(student);
    }

    public Student update(Long id, Student student) {
        if (!studentRepository.existsById(id)) {
            throw new RuntimeException("Estudiante no encontrado");
        }
        student.setId(id);
        return studentRepository.save(student);
    }

    public void deleteById(Long id) {
        studentRepository.deleteById(id);
    }

    public int uploadStudentsFromExcel(Long sectionId, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        com.seguimiento.semanal.entity.Section section = new com.seguimiento.semanal.entity.Section();
        section.setId(sectionId);

        int count = 0;
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(file.getInputStream())) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            for (org.apache.poi.ss.usermodel.Row row : sheet) {
                org.apache.poi.ss.usermodel.Cell cell = row.getCell(0, org.apache.poi.ss.usermodel.Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                String email = cell.getStringCellValue().trim();
                
                if (!email.toLowerCase().contains("@usach.cl")) {
                    continue; // Skip headers or empty rows
                }

                if (studentRepository.findByEmail(email).stream()
                        .anyMatch(s -> s.getSection() != null && s.getSection().getId().equals(sectionId))) {
                    continue; // Skip if already registered in THIS exact section
                }

                String[] parts = email.split("@")[0].split("\\.");
                String name = parts.length > 0 ? capitalize(parts[0]) : "Desconocido";
                String lastname = parts.length > 1 ? capitalize(parts[1]) : "Desconocido";

                Student student = new Student();
                student.setEmail(email.toLowerCase());
                student.setName(name);
                student.setLastname(lastname);
                student.setSection(section);
                
                studentRepository.save(student);
                count++;
            }
        }
        return count;
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
