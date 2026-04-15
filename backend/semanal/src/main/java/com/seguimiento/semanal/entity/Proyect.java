package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

/**
 * Entidad que representa un proyecto dentro de una sección.
 * Los proyectos son el marco sobre el cual los alumnos registran sus avances semanales.
 */
@Entity
@Table(name = "proyect")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proyect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_section", nullable = false)
    private Section section;

    @OneToMany(mappedBy = "proyect", cascade = CascadeType.ALL)
    private List<Advance> advances;
}
