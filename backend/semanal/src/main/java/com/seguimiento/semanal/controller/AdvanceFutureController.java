package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.AdvanceFuture;
import com.seguimiento.semanal.service.AdvanceFutureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/advance-futures")
@RequiredArgsConstructor
public class AdvanceFutureController {

    private final AdvanceFutureService advanceFutureService;

    @GetMapping
    public List<AdvanceFuture> getAll() {
        return advanceFutureService.findAll();
    }

    @PostMapping
    public AdvanceFuture create(@RequestBody AdvanceFuture advanceFuture) {
        return advanceFutureService.save(advanceFuture);
    }
}
