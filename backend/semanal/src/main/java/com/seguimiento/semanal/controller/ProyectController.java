package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.Proyect;
import com.seguimiento.semanal.service.ProyectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/proyects")
@RequiredArgsConstructor
public class ProyectController {

    private final ProyectService proyectService;

    @GetMapping
    public List<Proyect> getAll() {
        return proyectService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proyect> getById(@PathVariable Long id) {
        return proyectService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Proyect create(@RequestBody Proyect proyect) {
        return proyectService.save(proyect);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        proyectService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
