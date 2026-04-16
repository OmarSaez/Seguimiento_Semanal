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

    @PostMapping
    public Student create(@RequestBody Student student) {
        return studentService.save(student);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> update(@PathVariable Long id, @RequestBody Student student) {
        try {
            return ResponseEntity.ok(studentService.update(id, student));
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
    public ResponseEntity<String> uploadStudents(@PathVariable Long sectionId, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            int count = studentService.uploadStudentsFromExcel(sectionId, file);
            return ResponseEntity.ok("Se crearon " + count + " alumnos exitosamente.");
        } catch (java.io.IOException e) {
            return ResponseEntity.badRequest().body("Error al leer el archivo Excel: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Ocurrió un error inesperado al procesar el archivo.");
        }
    }
}
