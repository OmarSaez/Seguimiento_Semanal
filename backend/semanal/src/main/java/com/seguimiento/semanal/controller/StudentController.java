package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public List<Student> getAll() {
        return studentService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getById(@PathVariable Long id) {
        return studentService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/section/{sectionId}")
    public List<Student> getBySection(@PathVariable Long sectionId) {
        return studentService.findBySectionId(sectionId);
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkStudent(@RequestParam String email, @RequestParam(required = false) Long currentSectionId) {
        return ResponseEntity.ok(studentService.checkStudent(email, currentSectionId));
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transferStudents(@RequestBody java.util.Map<String, Object> request) {
        try {
            String email = (String) request.get("email");
            @SuppressWarnings("unchecked")
            List<String> emails = (List<String>) request.get("emails");
            Number targetSectionIdNum = (Number) request.get("targetSectionId");
            
            if (targetSectionIdNum == null) {
                return ResponseEntity.badRequest().body("Se requiere targetSectionId");
            }
            Long targetSectionId = targetSectionIdNum.longValue();

            if (emails != null && !emails.isEmpty()) {
                studentService.transferStudents(emails, targetSectionId);
                return ResponseEntity.ok(java.util.Map.of("message", "Alumnos trasladados con éxito."));
            } else if (email != null && !email.trim().isEmpty()) {
                studentService.transferStudent(email, targetSectionId);
                return ResponseEntity.ok(java.util.Map.of("message", "Alumno trasladado con éxito."));
            } else {
                return ResponseEntity.badRequest().body("Se requiere email o emails");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resolve-conflicts")
    public ResponseEntity<?> resolveConflicts(@RequestBody java.util.Map<String, Object> request) {
        try {
            Number targetSectionIdNum = (Number) request.get("targetSectionId");
            if (targetSectionIdNum == null) {
                return ResponseEntity.badRequest().body("Se requiere targetSectionId");
            }
            Long targetSectionId = targetSectionIdNum.longValue();

            @SuppressWarnings("unchecked")
            List<java.util.Map<String, Object>> resolutions = (List<java.util.Map<String, Object>>) request.get("resolutions");
            if (resolutions == null || resolutions.isEmpty()) {
                return ResponseEntity.badRequest().body("Se requiere una lista de resoluciones");
            }

            studentService.resolveConflicts(targetSectionId, resolutions);
            return ResponseEntity.ok(java.util.Map.of("message", "Conflictos resueltos con éxito."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Student student) {
        try {
            return ResponseEntity.ok(studentService.save(student));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Student student) {
        try {
            return ResponseEntity.ok(studentService.update(id, student));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/section/{sectionId}/upload")
    public ResponseEntity<java.util.Map<String, Object>> uploadStudents(@PathVariable Long sectionId, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            java.util.Map<String, Object> result = studentService.uploadStudentsFromExcel(sectionId, file);
            return ResponseEntity.ok(result);
        } catch (java.io.IOException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Error al leer el archivo Excel: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Ocurrió un error inesperado al procesar el archivo."));
        }
    }
}
