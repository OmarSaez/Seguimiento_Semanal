package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Advance;
import com.seguimiento.semanal.repository.AdvanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdvanceService {

    private final AdvanceRepository advanceRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public List<Advance> findAll() {
        return advanceRepository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Optional<Advance> findById(Long id) {
        return advanceRepository.findById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Advance save(Advance advance) {
        return advanceRepository.save(advance);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(Long id) {
        advanceRepository.deleteById(id);
    }
}
