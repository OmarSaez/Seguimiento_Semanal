package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Teacher;
import com.seguimiento.semanal.entity.Helper;
import com.seguimiento.semanal.repository.TeacherRepository;
import com.seguimiento.semanal.repository.HelperRepository;
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
    private final HelperRepository helperRepository;

    public List<Teacher> findAll() {
        return teacherRepository.findAll();
    }

    public Optional<Teacher> findById(Long id) {
        return teacherRepository.findById(id);
    }

    @Transactional
    public Teacher save(Teacher teacher) {
        String email = teacher.getEmail().trim().toLowerCase();
        if (teacherRepository.findByEmail(email).isPresent() || helperRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("El correo del docente ya está registrado en el sistema.");
        }
        teacher.setEmail(email);

        if (teacher.getHelpers() == null) {
            teacher.setHelpers(new java.util.ArrayList<>());
        }

        Teacher savedTeacher = teacherRepository.save(teacher);

        if (teacher.getHelpers() != null && !teacher.getHelpers().isEmpty()) {
            synchronizeHelper(savedTeacher, teacher.getHelpers());
            savedTeacher = teacherRepository.save(savedTeacher);
        }

        return savedTeacher;
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

    @Transactional
    public Teacher update(Long id, Teacher teacherDetails) {
        Teacher existingTeacher = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Docente no encontrado"));

        existingTeacher.setName(teacherDetails.getName());

        String email = teacherDetails.getEmail().trim().toLowerCase();
        if (!email.equals(existingTeacher.getEmail())) {
            if (teacherRepository.findByEmail(email).isPresent() || helperRepository.findByEmail(email).isPresent()) {
                throw new IllegalArgumentException("El correo del docente ya está registrado en el sistema.");
            }
            existingTeacher.setEmail(email);
        }

        if (teacherDetails.getPassword() != null && !teacherDetails.getPassword().trim().isEmpty()) {
            existingTeacher.setPassword(teacherDetails.getPassword());
        }

        // Synchronize helper details
        if (teacherDetails.getHelpers() != null) {
            synchronizeHelper(existingTeacher, teacherDetails.getHelpers());
        }

        return teacherRepository.save(existingTeacher);
    }

    /**
     * Crea una nueva cuenta de profesor (Rol Administrador).
     */
    public Teacher createTeacher(Teacher newTeacher) {
        return save(newTeacher);
    }

    private void synchronizeHelper(Teacher teacher, List<Helper> incomingHelpers) {
        if (incomingHelpers == null || incomingHelpers.isEmpty()) {
            return;
        }

        Helper incoming = incomingHelpers.get(0);
        if (incoming.getEmail() == null || incoming.getEmail().trim().isEmpty()) {
            // If the incoming email is empty, and teacher had a helper, we clear it (remove helper)
            if (teacher.getHelpers() != null && !teacher.getHelpers().isEmpty()) {
                teacher.getHelpers().clear();
            }
            return;
        }

        String email = incoming.getEmail().trim().toLowerCase();
        if (!email.endsWith("@usach.cl")) {
            throw new IllegalArgumentException("El correo del ayudante debe pertenecer a la institución (@usach.cl)");
        }

        // Check duplicate email in teachers
        Optional<Teacher> dupTeacher = teacherRepository.findByEmail(email);
        if (dupTeacher.isPresent()) {
            throw new IllegalArgumentException("El correo del ayudante ya está registrado como docente.");
        }

        if (teacher.getHelpers() != null && !teacher.getHelpers().isEmpty()) {
            Helper existing = teacher.getHelpers().get(0);

            // Check if email changed and is taken by another helper
            Optional<Helper> dupHelper = helperRepository.findByEmail(email);
            if (dupHelper.isPresent() && !dupHelper.get().getId().equals(existing.getId())) {
                throw new IllegalArgumentException("El correo del ayudante ya está registrado para otro ayudante.");
            }

            existing.setEmail(email);
            if (incoming.getPassword() != null && !incoming.getPassword().trim().isEmpty()) {
                existing.setPassword(incoming.getPassword().trim());
            }
            if (incoming.getName() != null && !incoming.getName().trim().isEmpty()) {
                existing.setName(incoming.getName().trim());
            } else {
                existing.setName(capitalizeEmail(email));
            }
        } else {
            // Check if email is already taken by any helper
            Optional<Helper> dupHelper = helperRepository.findByEmail(email);
            if (dupHelper.isPresent()) {
                throw new IllegalArgumentException("El correo del ayudante ya está registrado para otro ayudante.");
            }

            Helper newHelper = new Helper();
            newHelper.setEmail(email);
            newHelper.setPassword(incoming.getPassword() != null && !incoming.getPassword().trim().isEmpty() ? incoming.getPassword().trim() : "123456");
            newHelper.setName(incoming.getName() != null && !incoming.getName().trim().isEmpty() ? incoming.getName().trim() : capitalizeEmail(email));
            newHelper.setTeacher(teacher);
            
            if (teacher.getHelpers() == null) {
                teacher.setHelpers(new java.util.ArrayList<>());
            }
            teacher.getHelpers().add(newHelper);
        }
    }

    private String capitalizeEmail(String email) {
        if (email == null || !email.contains("@")) return "Ayudante";
        String prefix = email.split("@")[0];
        String[] parts = prefix.split("\\.");
        if (parts.length >= 2) {
            return capitalize(parts[0]) + " " + capitalize(parts[1]) + " (Ayudante)";
        }
        return capitalize(prefix) + " (Ayudante)";
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
