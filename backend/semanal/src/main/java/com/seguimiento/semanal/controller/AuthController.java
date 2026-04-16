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
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    @GetMapping("/me")
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
            Optional<Student> student = studentRepository.findByEmail(email);
            student.ifPresent(s -> {
                userDetails.put("id", s.getId());
                userDetails.put("name", s.getName() + " " + s.getLastname());
                userDetails.put("sectionId", s.getSection().getId());
                userDetails.put("sectionCode", s.getSection().getSectionCode());
                userDetails.put("startDate", s.getSection().getStartDate());
                userDetails.put("finishDate", s.getSection().getFinishDate());
            });
        }

        return userDetails;
    }
}
