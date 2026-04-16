package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
/**
 * Entidad que representa los Detalles Específicos de una rama de actividad ejecutada.
 * <p>
 * Extiende al reporte raíz de un Avance proveyendo desglose granular (sub-partes de trabajo).
 * Por ejemplo, si en una semana el alumno hizo tanto diseño de interfaz como base de datos,
 * esos conforman dos distintas tuplas de instanciación "AdvanceDetail".
 * Cada detalle resguarda sus propias Horas Humanas (HH) invertidas, Tipo de trabajo y un Texto contextual.
 * <p>
 * Relaciones de Entidad:
 * - Depende y viaja adjunto a un Avance Semanal superior (relación ManyToOne).
 */
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
