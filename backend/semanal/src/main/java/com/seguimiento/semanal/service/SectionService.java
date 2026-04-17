package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Section;
import com.seguimiento.semanal.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SectionService {

    private final SectionRepository sectionRepository;

    public List<Section> findAll() {
        return sectionRepository.findAllByOrderByYearDescSemesterDesc();
    }

    public List<Section> findByTeacherEmail(String email) {
        return sectionRepository.findByTeacherEmailOrderByYearDescSemesterDesc(email);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public Optional<Section> findById(Long id) {
        return sectionRepository.findById(id);
    }

    public Section save(Section section) {
        return sectionRepository.save(section);
    }

    public Section update(Long id, Section section) {
        if (!sectionRepository.existsById(id)) {
            throw new RuntimeException("Sección no encontrada");
        }
        section.setId(id);
        return sectionRepository.save(section);
    }

    public void deleteById(Long id) {
        sectionRepository.deleteById(id);
    }
}
