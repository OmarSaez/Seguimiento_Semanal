package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;
/**
 * Entidad que representa al Profesor (Docente) en el sistema.
 * <p>
 * En el contexto de la plataforma, el docente actúa asumiendo el rol de Administrador.
 * Tiene todos los privilegios y responsabilidades para gestionar íntegramente el panel:
 * puede crear, modificar y eliminar estudiantes, proyectos y a otros docentes.
 * Además, es el encargado de crear, gestionar y modificar las Secciones académicas a su cargo.
 * <p>
 * Relaciones de Entidad:
 * - Un Profesor administra múltiples Secciones (relación OneToMany).
 */
@Entity
@Table(name = "teacher")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
    @JsonIgnoreProperties("teacher")
    private List<Section> sections;
}
