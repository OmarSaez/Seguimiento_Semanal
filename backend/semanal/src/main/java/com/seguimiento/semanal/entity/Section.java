package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

/**
 * Entidad que representa una sección académica o curso.
 * Una sección es creada por un profesor, contiene múltiples estudiantes
 * y tiene diversos proyectos asociados para el seguimiento semanal.
 */
@Entity
@Table(name = "section")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_code", nullable = false)
    private String sectionCode;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false)
    private Integer year;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_teacher", nullable = false)
    private Teacher teacher;

    @Column(name = "is_active")
    private Boolean isActive;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL)
    private List<Proyect> proyects;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL)
    private List<Student> students;
}
