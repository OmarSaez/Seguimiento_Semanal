package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.AdvanceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdvanceDetailRepository extends JpaRepository<AdvanceDetail, Long> {
}
