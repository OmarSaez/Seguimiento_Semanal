package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entidad que representa el detalle específico de un avance semanal.
 * Contiene información sobre el tipo de avance realizado, el contexto y
 * la cantidad de horas (hh) dedicadas a dicha tarea.
 */
@Entity
@Table(name = "advance_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvanceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_advance", nullable = false)
    private Advance advance;

    @Column(name = "type_advance", nullable = false)
    private String typeAdvance;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(name = "hh")
    private Integer hh;
}
