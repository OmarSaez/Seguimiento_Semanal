package com.seguimiento.semanal.repository;

import com.seguimiento.semanal.entity.Helper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface HelperRepository extends JpaRepository<Helper, Long> {
    Optional<Helper> findByEmail(String email);
    List<Helper> findByTeacherId(Long teacherId);
}
