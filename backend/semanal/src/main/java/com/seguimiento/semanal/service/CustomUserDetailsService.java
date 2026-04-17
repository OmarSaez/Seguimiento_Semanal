package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.entity.Teacher;
import com.seguimiento.semanal.repository.StudentRepository;
import com.seguimiento.semanal.repository.TeacherRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    public CustomUserDetailsService(TeacherRepository teacherRepository, StudentRepository studentRepository) {
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Buscar en profesores primero
        Optional<Teacher> teacher = teacherRepository.findByEmail(email);
        if (teacher.isPresent()) {
            return User.builder()
                    .username(teacher.get().getEmail())
                    .password("{noop}" + teacher.get().getPassword()) // {noop} para texto plano
                    .roles("ADMIN")
                    .build();
        }

        // Buscar en estudiantes segundo (Soporta múltiples registros para alumnos repitentes)
        List<Student> students = studentRepository.findByEmail(email);
        if (!students.isEmpty()) {
            boolean hasActiveSection = students.stream()
                    .anyMatch(s -> s.getSection() != null && Boolean.TRUE.equals(s.getSection().getIsActive()));
            
            if (!hasActiveSection) {
                throw new UsernameNotFoundException("El alumno está registrado, pero el acceso está bloqueado porque todas sus secciones están interactivas/cerradas.");
            }

            return User.builder()
                    .username(email)
                    .password("{noop}student_access") // Contraseña fija para simplificar el acceso
                    .roles("STUDENT")
                    .build();
        }

        throw new UsernameNotFoundException("Usuario no encontrado con el email: " + email);
    }
}
