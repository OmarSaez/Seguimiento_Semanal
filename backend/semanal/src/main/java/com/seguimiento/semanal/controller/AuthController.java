package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.entity.Student;
import com.seguimiento.semanal.entity.Teacher;
import com.seguimiento.semanal.repository.StudentRepository;
import com.seguimiento.semanal.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        Map<String, Object> userDetails = new HashMap<>();
        String email = authentication.getName();
        userDetails.put("email", email);
        
        var roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        userDetails.put("roles", roles);

        if (roles.contains("ROLE_ADMIN")) {
            Optional<Teacher> teacher = teacherRepository.findByEmail(email);
            teacher.ifPresent(t -> {
                userDetails.put("id", t.getId());
                userDetails.put("name", t.getName());
            });
        } else if (roles.contains("ROLE_STUDENT")) {
            List<Student> students = studentRepository.findByEmail(email);
            if (!students.isEmpty()) {
                // Si el alumno repitió y tiene múltiples secciones, tomamos la activa para su dashboard
                Student activeStudent = students.stream()
                        .filter(s -> s.getSection() != null && Boolean.TRUE.equals(s.getSection().getIsActive()))
                        .findFirst()
                        .orElse(students.get(0));

                userDetails.put("id", activeStudent.getId());
                userDetails.put("name", activeStudent.getName() + " " + activeStudent.getLastname());
                userDetails.put("sectionId", activeStudent.getSection().getId());
                userDetails.put("sectionCode", activeStudent.getSection().getSectionCode());
                userDetails.put("startDate", activeStudent.getSection().getStartDate());
                userDetails.put("finishDate", activeStudent.getSection().getFinishDate());
            }
        }

        return userDetails;
    }
}
