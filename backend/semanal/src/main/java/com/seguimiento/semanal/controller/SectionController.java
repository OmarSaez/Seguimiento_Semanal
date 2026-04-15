package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.Section;
import com.seguimiento.semanal.service.SectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    @GetMapping
    public List<Section> getAll() {
        return sectionService.findAll();
    }

    @GetMapping("/teacher/{email}")
    public List<Section> getByTeacher(@PathVariable String email) {
        return sectionService.findByTeacherEmail(email);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Section> getById(@PathVariable Long id) {
        return sectionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Section create(@RequestBody Section section) {
        return sectionService.save(section);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Section> update(@PathVariable Long id, @RequestBody Section section) {
        try {
            return ResponseEntity.ok(sectionService.update(id, section));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sectionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
