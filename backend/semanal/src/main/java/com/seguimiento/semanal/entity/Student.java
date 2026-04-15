package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

/**
 * Entidad que representa a un estudiante.
 * Un estudiante pertenece a una sección específica y es el encargado de
 * registrar sus propios avances semanales en los proyectos asignados.
 */
@Entity
@Table(name = "student")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String lastname;

    @Column(nullable = false)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_section", nullable = false)
    private Section section;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    private List<Advance> advances;
}
