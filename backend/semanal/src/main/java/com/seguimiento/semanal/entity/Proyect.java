package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;
/**
 * Entidad que representa un Proyecto de desarrollo dentro de una Sección.
 * <p>
 * El Proyecto actúa como el "Grupo de Trabajo" en una clase.
 * Representa usualmente el producto de software que se está construyendo para un cliente real
 * a lo largo de un semestre. Los estudiantes dedican y amarran todas sus horas humanas realizadas
 * a un Proyecto en específico para permitir construir el análisis grupal en la plataforma.
 * Son definidos por el Docente.
 * <p>
 * Relaciones de Entidad:
 * - Es una invención que existe dentro de una única Sección (relación ManyToOne).
 * - Absorbe los Avances individuales vinculados a él por los alumnos (relación OneToMany).
 */
@Entity
@Table(name = "proyect")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Proyect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_section", nullable = false)
    @JsonIgnoreProperties({"proyects", "students", "teacher"})
    private Section section;

    @OneToMany(mappedBy = "proyect", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("proyect")
    private List<Advance> advances;
}
