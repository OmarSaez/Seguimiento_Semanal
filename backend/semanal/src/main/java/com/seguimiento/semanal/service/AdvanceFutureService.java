package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.AdvanceFuture;
import com.seguimiento.semanal.repository.AdvanceFutureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdvanceFutureService {

    private final AdvanceFutureRepository advanceFutureRepository;

    public List<AdvanceFuture> findAll() {
        return advanceFutureRepository.findAll();
    }

    public AdvanceFuture save(AdvanceFuture advanceFuture) {
        return advanceFutureRepository.save(advanceFuture);
    }
}
