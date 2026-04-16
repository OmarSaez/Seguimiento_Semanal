package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.AdvanceFuture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdvanceFutureRepository extends JpaRepository<AdvanceFuture, Long> {
}
