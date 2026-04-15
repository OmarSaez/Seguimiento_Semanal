package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByTeacherEmailOrderByYearDescSemesterDesc(String email);
    List<Section> findAllByOrderByYearDescSemesterDesc();
}
