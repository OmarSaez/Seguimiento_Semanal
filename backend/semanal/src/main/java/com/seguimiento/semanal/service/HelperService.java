package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Helper;
import com.seguimiento.semanal.entity.Teacher;
import com.seguimiento.semanal.repository.HelperRepository;
import com.seguimiento.semanal.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HELPER')")
public class HelperService {

    private final HelperRepository helperRepository;
    private final TeacherRepository teacherRepository;

    public List<Helper> findAll() {
        return helperRepository.findAll();
    }

    public Optional<Helper> findById(Long id) {
        return helperRepository.findById(id);
    }

    public Optional<Helper> findByEmail(String email) {
        return helperRepository.findByEmail(email.trim().toLowerCase());
    }

    public List<Helper> findByTeacherId(Long teacherId) {
        return helperRepository.findByTeacherId(teacherId);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public Helper save(Helper helper) {
        validateEmail(helper.getEmail());
        helper.setEmail(helper.getEmail().trim().toLowerCase());

        // Verificar duplicidad de email en ayudantes y profesores
        if (helperRepository.findByEmail(helper.getEmail()).isPresent() ||
            teacherRepository.findByEmail(helper.getEmail()).isPresent()) {
            throw new IllegalArgumentException("El correo ya está registrado en el sistema.");
        }

        // Auto-completar nombre desde el correo electrónico
        if (helper.getName() == null || helper.getName().trim().isEmpty()) {
            helper.setName(capitalizeEmail(helper.getEmail()));
        }

        return helperRepository.save(helper);
    }

    @Transactional
    public Helper update(Long id, Helper helperDetails) {
        Helper helper = helperRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ayudante no encontrado"));

        // Restricción de seguridad: un ayudante sólo puede modificarse a sí mismo.
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            boolean isHelper = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_HELPER"));
            if (isHelper && !helper.getEmail().equals(auth.getName())) {
                throw new org.springframework.security.access.AccessDeniedException("Acción denegada: Un ayudante solo puede modificar sus propios datos.");
            }
        }

        // Los ayudantes solo pueden cambiar su propia clave. Los docentes pueden cambiar todo.
        // Spring Security maneja el bloqueo pero aquí lo validamos también por seguridad de datos.
        if (helperDetails.getPassword() != null && !helperDetails.getPassword().trim().isEmpty()) {
            helper.setPassword(helperDetails.getPassword());
        }

        if (helperDetails.getName() != null && !helperDetails.getName().trim().isEmpty()) {
            helper.setName(helperDetails.getName());
        }

        if (helperDetails.getEmail() != null && !helperDetails.getEmail().trim().isEmpty()) {
            validateEmail(helperDetails.getEmail());
            String newEmail = helperDetails.getEmail().trim().toLowerCase();
            if (!newEmail.equals(helper.getEmail())) {
                if (helperRepository.findByEmail(newEmail).isPresent() ||
                    teacherRepository.findByEmail(newEmail).isPresent()) {
                    throw new IllegalArgumentException("El correo ya está registrado en el sistema.");
                }
                helper.setEmail(newEmail);
            }
        }

        return helperRepository.save(helper);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(Long id) {
        helperRepository.deleteById(id);
    }

    private void validateEmail(String email) {
        if (email == null || !email.toLowerCase().endsWith("@usach.cl")) {
            throw new IllegalArgumentException("El correo debe pertenecer a la institución (@usach.cl)");
        }
    }

    private String capitalizeEmail(String email) {
        if (email == null || !email.contains("@")) return "Ayudante";
        String prefix = email.split("@")[0];
        String[] parts = prefix.split("\\.");
        if (parts.length >= 2) {
            return capitalize(parts[0]) + " " + capitalize(parts[1]);
        }
        return capitalize(prefix);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
