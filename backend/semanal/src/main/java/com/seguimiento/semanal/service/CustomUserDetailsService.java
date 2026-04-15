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

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    public CustomUserDetailsService(TeacherRepository teacherRepository, StudentRepository studentRepository) {
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
    }

    @Override
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

        // Buscar en estudiantes segundo (Sin contraseña obligatoria desde el DB)
        Optional<Student> student = studentRepository.findByEmail(email);
        if (student.isPresent()) {
            return User.builder()
                    .username(student.get().getEmail())
                    .password("{noop}student_access") // Contraseña fija para simplificar el acceso
                    .roles("STUDENT")
                    .build();
        }

        throw new UsernameNotFoundException("Usuario no encontrado con el email: " + email);
    }
}
