package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Teacher;
import com.seguimiento.semanal.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public void deleteById(Long id, String currentEmail) {
        // 1. Verificar si es el último docente
        long count = teacherRepository.count();
        if (count <= 1) {
            throw new RuntimeException("No se puede eliminar el último docente del sistema.");
        }

        // 2. Verificar si intenta eliminarse a sí mismo
        Optional<Teacher> teacherToDelete = teacherRepository.findById(id);
        Teacher teacher = teacherToDelete.get();
        if (teacher.getEmail().equals(currentEmail)) {
            throw new RuntimeException("No puedes eliminar tu propia cuenta.");
        }

        // Historial: Desvincular e inactivar sus secciones para preservar datos (ON DELETE SET NULL)
        if (teacher.getSections() != null) {
            for (com.seguimiento.semanal.entity.Section s : teacher.getSections()) {
                s.setTeacher(null);
                s.setIsActive(false); // Inactivar la sección forzosamente porque perdió su docente
            }
        }

        teacherRepository.delete(teacher);
    }

    public Teacher update(Long id, Teacher teacher) {
        if (!teacherRepository.existsById(id)) {
            throw new RuntimeException("Docente no encontrado");
        }
        teacher.setId(id);
        return teacherRepository.save(teacher);
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
