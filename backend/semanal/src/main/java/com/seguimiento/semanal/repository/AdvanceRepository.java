package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.Advance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdvanceRepository extends JpaRepository<Advance, Long> {
}
