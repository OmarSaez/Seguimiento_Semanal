package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Teacher;
import com.seguimiento.semanal.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TeacherService {

    private final TeacherRepository teacherRepository;

    public List<Teacher> findAll() {
        return teacherRepository.findAll();
    }

    public Optional<Teacher> findById(Long id) {
        return teacherRepository.findById(id);
    }

    public Teacher save(Teacher teacher) {
        return teacherRepository.save(teacher);
    }

    public void deleteById(Long id) {
        teacherRepository.deleteById(id);
    }

    /**
     * Crea una nueva cuenta de profesor (Rol Administrador).
     */
    public Teacher createTeacher(Teacher newTeacher) {
        return teacherRepository.save(newTeacher);
    }

    // Nota: El registro de proyectos y alumnos se realiza a través de sus respectivos servicios,
    // pero el Profesor es el actor que inicia estas acciones en el flujo del sistema.
}
