package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.Advance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvanceRepository extends JpaRepository<Advance, Long> {
    List<Advance> findByStudentIdOrderBySendDateDesc(Long studentId);
    List<Advance> findByProyectSectionIdOrderBySendDateDesc(Long sectionId);
}
