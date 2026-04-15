package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;

/**
 * Entidad que representa a un estudiante.
 */
@Entity
@Table(name = "student")
@Getter
@Setter
@AllArgsConstructor
@Builder
public class Student {

    public Student() {} // Constructor explícito

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String lastname;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_section", nullable = false)
    @JsonIgnoreProperties({"students", "teacher", "proyects"})
    private Section section;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("student")
    private List<Advance> advances;
}
