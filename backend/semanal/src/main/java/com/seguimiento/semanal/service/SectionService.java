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

    public void checkAndDeactivate(Section section) {
        if (section == null) return;
        if (section.getIsActive() != null && section.getIsActive()) {
            java.time.LocalDate now = java.time.LocalDate.now();
            java.time.LocalDate limitDate = null;
            if (section.getFinishDate() != null) {
                limitDate = section.getFinishDate().plusMonths(1).plusDays(5);
            } else if (section.getStartDate() != null) {
                limitDate = section.getStartDate().plusWeeks(22);
            }
            
            if (limitDate != null && (now.isAfter(limitDate) || now.isEqual(limitDate))) {
                section.setIsActive(false);
                sectionRepository.save(section);
            }
        }
    }

    public List<Section> findAll() {
        List<Section> list = sectionRepository.findAllByOrderByYearDescSemesterDesc();
        list.forEach(this::checkAndDeactivate);
        return list;
    }

    public List<Section> findByTeacherEmail(String email) {
        List<Section> list = sectionRepository.findByTeacherEmailOrderByYearDescSemesterDesc(email);
        list.forEach(this::checkAndDeactivate);
        return list;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public Optional<Section> findById(Long id) {
        Optional<Section> opt = sectionRepository.findById(id);
        opt.ifPresent(this::checkAndDeactivate);
        return opt;
    }

    public Section save(Section section) {
        checkAndDeactivate(section);
        return sectionRepository.save(section);
    }

    public Section update(Long id, Section sectionDetails) {
        Section existingSection = sectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sección no encontrada"));

        // Actualizar solo campos básicos de la sección
        existingSection.setSectionCode(sectionDetails.getSectionCode());
        existingSection.setSemester(sectionDetails.getSemester());
        existingSection.setYear(sectionDetails.getYear());
        existingSection.setIsActive(sectionDetails.getIsActive());
        existingSection.setStartDate(sectionDetails.getStartDate());
        existingSection.setFinishDate(sectionDetails.getFinishDate());
        
        // Actualizar el docente si viene en la petición
        if (sectionDetails.getTeacher() != null) {
            existingSection.setTeacher(sectionDetails.getTeacher());
        }

        // NO tocamos existingSection.getProyects() ni getStudents()
        // así se mantienen los datos existentes.

        return sectionRepository.save(existingSection);
    }

    public void deleteById(Long id) {
        sectionRepository.deleteById(id);
    }
}
