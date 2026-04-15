package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.Proyect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProyectRepository extends JpaRepository<Proyect, Long> {
    List<Proyect> findBySectionId(Long sectionId);
}
