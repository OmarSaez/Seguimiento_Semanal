package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;

/**
 * Entidad que representa a un profesor en el sistema.
 */
@Entity
@Table(name = "teacher")
@Getter
@Setter
@AllArgsConstructor
@Builder
public class Teacher {

    public Teacher() {} // Constructor explícito

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
