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

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public List<Advance> findByStudentId(Long studentId) {
        return advanceRepository.findByStudentIdOrderBySendDateDesc(studentId);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public Optional<Advance> findById(Long id) {
        return advanceRepository.findById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public Advance save(Advance advance) {
        // Asegurar que las relaciones bidireccionales estén establecidas para el cascade detalls y futureAdvances
        if (advance.getDetails() != null) {
            advance.getDetails().forEach(d -> d.setAdvance(advance));
        }
        if (advance.getFutureAdvances() != null) {
            advance.getFutureAdvances().forEach(f -> f.setAdvance(advance));
        }
        return advanceRepository.save(advance);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(Long id) {
        advanceRepository.deleteById(id);
    }
}
