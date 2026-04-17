package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByEmail(String email);
    List<Student> findBySectionId(Long sectionId);
}
