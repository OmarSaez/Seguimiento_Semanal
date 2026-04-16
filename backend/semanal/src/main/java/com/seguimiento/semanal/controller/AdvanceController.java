package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.Advance;
import com.seguimiento.semanal.service.AdvanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/advances")
@RequiredArgsConstructor
public class AdvanceController {

    private final AdvanceService advanceService;

    @GetMapping
    public List<Advance> getAll() {
        return advanceService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Advance> getById(@PathVariable Long id) {
        return advanceService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public List<Advance> getByStudentId(@PathVariable Long studentId) {
        return advanceService.findByStudentId(studentId);
    }

    @PostMapping
    public Advance create(@RequestBody Advance advance) {
        return advanceService.save(advance);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        advanceService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
