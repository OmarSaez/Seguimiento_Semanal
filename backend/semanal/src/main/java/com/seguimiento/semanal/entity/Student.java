package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;
/**
 * Entidad que representa a un Alumno (Estudiante) matriculado en una Sección.
 * <p>
 * El perfil Estudiante asume el rol de usuario estándar en el sistema. 
 * Son el actor principal a la hora de inyectar y poblar la plataforma de datos mediante
 * el envío semanal de sus correspondientes reportes de Avance (Advance).
 * Son administrados, creados, y borrados exclusivamente por los Docentes (carga manual o masiva).
 * <p>
 * Relaciones de Entidad:
 * - Se asocia/matrícula bajo una única Sección en curso (relación ManyToOne).
 * - Emite y es propietario de un extenso listado de Avances semanales históricos (relación OneToMany).
 */
@Entity
@Table(name = "student")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String lastname;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_section", nullable = false)
    @JsonIgnoreProperties({"students", "teacher", "proyects"})
    private Section section;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("student")
    private List<Advance> advances;
}
