package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Proyect;
import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.repository.ProyectRepository;
import com.seguimiento.semanal.repository.StudentRepository;
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

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public List<Proyect> findAll() {
        return proyectRepository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public Optional<Proyect> findById(Long id) {
        return proyectRepository.findById(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public List<Proyect> findBySectionId(Long sectionId) {
        return proyectRepository.findBySectionId(sectionId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Proyect save(Proyect proyect) {
        Proyect saved = proyectRepository.save(proyect);
        updateStudentsAssociation(saved, proyect.getStudents());
        return saved;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Proyect update(Long id, Proyect proyect) {
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
