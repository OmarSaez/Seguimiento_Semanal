package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;

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

    @OneToMany(mappedBy = "proyect", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("proyect")
    private List<Advance> advances;
}
