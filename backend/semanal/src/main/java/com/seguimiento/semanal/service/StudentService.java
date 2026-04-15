package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para la gestión de estudiantes.
 * El Profesor/Admin es el encargado de agregar y gestionar a los alumnos en las secciones.
 */
@Service
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StudentService {

    private final StudentRepository studentRepository;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Optional<Student> findById(Long id) {
        return studentRepository.findById(id);
    }

    public Student save(Student student) {
        return studentRepository.save(student);
    }

    public void deleteById(Long id) {
        studentRepository.deleteById(id);
    }
}
