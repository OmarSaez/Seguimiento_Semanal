package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.Proyect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProyectRepository extends JpaRepository<Proyect, Long> {
}
