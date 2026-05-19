package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.Helper;
import com.seguimiento.semanal.service.HelperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/helpers")
@RequiredArgsConstructor
public class HelperController {

    private final HelperService helperService;

    @GetMapping
    public List<Helper> getAll() {
        return helperService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Helper> getById(@PathVariable Long id) {
        return helperService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public List<Helper> getByTeacherId(@PathVariable Long teacherId) {
        return helperService.findByTeacherId(teacherId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Helper helper) {
        try {
            return ResponseEntity.ok(helperService.save(helper));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Helper helper) {
        try {
            return ResponseEntity.ok(helperService.update(id, helper));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            helperService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
