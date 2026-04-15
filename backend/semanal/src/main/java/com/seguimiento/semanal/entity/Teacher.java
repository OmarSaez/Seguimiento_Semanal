package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

/**
 * Entidad que representa a un profesor en el sistema.
 * El profesor actúa como administrador: tiene la capacidad de crear otras cuentas 
 * de profesores, gestionar secciones, agregar alumnos a dichas secciones 
 * y crear los proyectos de seguimiento.
 */
@Entity
@Table(name = "teacher")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL)
    private List<Section> sections;
}
