package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Proyect;
import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.repository.ProyectRepository;
import com.seguimiento.semanal.repository.StudentRepository;
import com.seguimiento.semanal.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para la gestión de proyectos.
 * Los proyectos son creados y gestionados por el Profesor/Admin.
 */
@Service
@RequiredArgsConstructor
public class ProyectService {

    private final ProyectRepository proyectRepository;
    private final StudentRepository studentRepository;
    private final SectionRepository sectionRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'HELPER')")
    public List<Proyect> findAll() {
        return proyectRepository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'HELPER')")
    public Optional<Proyect> findById(Long id) {
        return proyectRepository.findById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'HELPER')")
    public List<Proyect> findBySectionId(Long sectionId) {
        return proyectRepository.findBySectionId(sectionId);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HELPER')")
    @Transactional
    public Proyect save(Proyect proyect) {
        checkSectionActiveForHelper(proyect.getSection());
        Proyect saved = proyectRepository.save(proyect);
        updateStudentsAssociation(saved, proyect.getStudents());
        return saved;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HELPER')")
    @Transactional
    public Proyect update(Long id, Proyect proyect) {
        checkSectionActiveForHelper(proyect.getSection());
        if (!proyectRepository.existsById(id)) {
            throw new RuntimeException("Proyecto no encontrado");
        }
        proyect.setId(id);
        Proyect saved = proyectRepository.save(proyect);
        updateStudentsAssociation(saved, proyect.getStudents());
        return saved;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(Long id) {
        proyectRepository.deleteById(id);
    }

    private void checkSectionActiveForHelper(com.seguimiento.semanal.entity.Section section) {
        if (section == null || section.getId() == null) return;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            boolean isHelper = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_HELPER"));
            if (isHelper) {
                com.seguimiento.semanal.entity.Section sec = sectionRepository.findById(section.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada"));
                if (sec.getIsActive() == null || !sec.getIsActive()) {
                    throw new org.springframework.security.access.AccessDeniedException("Acción denegada: La sección no está activa.");
                }
            }
        }
    }

    private void updateStudentsAssociation(Proyect proyect, List<Student> incomingStudents) {
        if (proyect.getSection() == null) return;
        List<Student> sectionStudents = studentRepository.findBySectionId(proyect.getSection().getId());
        
        java.util.Set<Long> incomingStudentIds = new java.util.HashSet<>();
        if (incomingStudents != null) {
            for (Student s : incomingStudents) {
                if (s.getId() != null) {
                    incomingStudentIds.add(s.getId());
                }
            }
        }

        for (Student s : sectionStudents) {
            boolean shouldBeInProject = incomingStudentIds.contains(s.getId());
            boolean currentlyInProject = s.getProyect() != null && s.getProyect().getId().equals(proyect.getId());

            if (shouldBeInProject && !currentlyInProject) {
                s.setProyect(proyect);
                studentRepository.save(s);
            } else if (!shouldBeInProject && currentlyInProject) {
                s.setProyect(null);
                studentRepository.save(s);
            }
        }
    }
}
