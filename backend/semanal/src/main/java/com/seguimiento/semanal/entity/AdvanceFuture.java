package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
/**
 * Entidad que representa un Compromiso (Promesa a Futuro) para iteraciones de Avance posteriores.
 * <p>
 * A diferencia del AdvanceDetail que constata qué y cuánto se hizo de facto, esta entidad guarda
 * una predicción. El alumno tilda actividades de las que asegura o vaticina que formarán parte 
 * de la siguiente agenda semanal. Su contraste posterior en cruce sistemático con los AdvanceDetail reales
 * engendra los "Indicadores Clave (KPI) de Cumplimiento".
 * <p>
 * Relaciones de Entidad:
 * - Depende y se emite colgado de un contenedor de Avance Semanal raíz (relación ManyToOne).
 */
@Entity
@Table(name = "advance_future")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdvanceFuture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_advance", nullable = false)
    @JsonIgnoreProperties("futureAdvances")
    private Advance advance;

    @Column(name = "type_advance", nullable = false)
    private String typeAdvance;
}
