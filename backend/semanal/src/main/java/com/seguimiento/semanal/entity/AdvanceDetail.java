package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Entity
@Table(name = "advance_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdvanceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_advance", nullable = false)
    @JsonIgnoreProperties("details")
    private Advance advance;

    @Column(name = "type_advance", nullable = false)
    private String typeAdvance;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(name = "hh")
    private Integer hh;
}
