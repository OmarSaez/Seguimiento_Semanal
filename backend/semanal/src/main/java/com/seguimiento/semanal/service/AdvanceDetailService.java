package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.AdvanceDetail;
import com.seguimiento.semanal.repository.AdvanceDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdvanceDetailService {

    private final AdvanceDetailRepository advanceDetailRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public List<AdvanceDetail> findAll() {
        return advanceDetailRepository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Optional<AdvanceDetail> findById(Long id) {
        return advanceDetailRepository.findById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public AdvanceDetail save(AdvanceDetail advanceDetail) {
        return advanceDetailRepository.save(advanceDetail);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(Long id) {
        advanceDetailRepository.deleteById(id);
    }
}
