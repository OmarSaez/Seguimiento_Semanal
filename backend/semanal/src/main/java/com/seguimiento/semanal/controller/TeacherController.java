package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.Teacher;
import com.seguimiento.semanal.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping
    public List<Teacher> getAll() {
        return teacherService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Teacher> getById(@PathVariable Long id) {
        return teacherService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Teacher create(@RequestBody Teacher teacher) {
        return teacherService.save(teacher);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Teacher> update(@PathVariable Long id, @RequestBody Teacher teacher) {
        try {
            return ResponseEntity.ok(teacherService.update(id, teacher));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, java.security.Principal principal) {
        try {
            teacherService.deleteById(id, principal.getName());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
