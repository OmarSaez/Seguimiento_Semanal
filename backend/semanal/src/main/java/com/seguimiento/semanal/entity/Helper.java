package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

/**
 * Entidad que representa a un Ayudante (Helper) en el sistema.
 * <p>
 * Los ayudantes son contratados por un Docente y tienen acceso restringido:
 * - Solo gestionan las secciones del docente al que están asociados.
 * - Pueden ingresar alumnos, ingresar proyectos, mover alumnos entre proyectos y descargar los reportes consolidados en Excel.
 * - NO pueden eliminar alumnos, ni eliminar proyectos, ni gestionar docentes.
 */
@Entity
@Table(name = "helper")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
public class Helper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_teacher")
    @JsonIgnoreProperties("helpers")
    private Teacher teacher;
}
