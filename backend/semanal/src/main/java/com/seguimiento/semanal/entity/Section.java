package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;

/**
 * Entidad que representa una Sección académica o curso semestral.
 * <p>
 * La Sección sirve como el núcleo agrupador principal donde ocurre el seguimiento.
 * Es administrada, creada y gestionada en su totalidad por un Docente (Teacher).
 * Dentro de una misma sección coexisten múltiples opciones de Proyectos de desarrollo y
 * se matricula el universo de Alumnos que cursará la asignatura.
 * <p>
 * Relaciones de Entidad:
 * - Es tutelada por un único Docente (relación ManyToOne).
 * - Agrupa y contiene múltiples Estudiantes matriculados (relación OneToMany).
 * - Agrega y contiene las opciones de Proyectos disponibles en el semestre (relación OneToMany).
 */
@Entity
@Table(name = "section")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
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

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "start_date")
    private java.time.LocalDate startDate;

    @Column(name = "finish_date")
    private java.time.LocalDate finishDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_teacher")
    @JsonIgnoreProperties("sections")
    private Teacher teacher;


    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("section")
    private List<Proyect> proyects;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("section")
    private List<Student> students;
}
