package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.Proyect;
import com.seguimiento.semanal.repository.ProyectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para la gestión de proyectos.
 * Los proyectos son creados y gestionados por el Profesor/Admin.
 */
@Service
@RequiredArgsConstructor
public class ProyectService {

    private final ProyectRepository proyectRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public List<Proyect> findAll() {
        return proyectRepository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Optional<Proyect> findById(Long id) {
        return proyectRepository.findById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Proyect save(Proyect proyect) {
        return proyectRepository.save(proyect);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(Long id) {
        proyectRepository.deleteById(id);
    }
}
