package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "advance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Advance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    @JsonIgnoreProperties("advances")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proyect", nullable = false)
    @JsonIgnoreProperties("advances")
    private Proyect proyect;

    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Column(name = "number_week")
    private Integer numberWeek;

    @Column(columnDefinition = "TEXT")
    private String problem;

    @OneToMany(mappedBy = "advance", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("advance")
    private List<AdvanceDetail> details;
}
