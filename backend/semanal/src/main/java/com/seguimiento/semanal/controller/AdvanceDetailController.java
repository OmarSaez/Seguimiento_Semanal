package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.AdvanceDetail;
import com.seguimiento.semanal.service.AdvanceDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/advance-details")
@RequiredArgsConstructor
public class AdvanceDetailController {

    private final AdvanceDetailService advanceDetailService;

    @GetMapping
    public List<AdvanceDetail> getAll() {
        return advanceDetailService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdvanceDetail> getById(@PathVariable Long id) {
        return advanceDetailService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public AdvanceDetail create(@RequestBody AdvanceDetail advanceDetail) {
        return advanceDetailService.save(advanceDetail);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        advanceDetailService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
