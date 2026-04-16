package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
/**
 * Entidad principal que encapsula un "Avance Semanal" emitido por un Estudiante.
 * <p>
 * Actúa estructuralmente como el Formulario Principal (Reporte de Seguimiento) de la semana.
 * Captura la metadata base, incluyendo desde qué Estudiante proviene, a qué Proyecto apunta,
 * e incluso qué número de semana calendario cursaba al momento del envío junto a problemas genéricos.
 * Sirve además como una raíz fuerte que amarra los desgloses hiper-específicos del trabajo 
 * (detalles realizados y promesas futuras).
 * <p>
 * Relaciones de Entidad:
 * - Pertenece a la autoría de un único Estudiante (relación ManyToOne).
 * - Aporta carga de trabajo a un único Proyecto (relación ManyToOne).
 * - Contiene en cascada múltiples Detalles de dedicación reales (AdvanceDetail) (relación OneToMany).
 * - Contiene en cascada las múltiples Promesas seleccionadas para la futura semana (AdvanceFuture) (relación OneToMany).
 */
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

    @OneToMany(mappedBy = "advance", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("advance")
    private List<AdvanceFuture> futureAdvances;
}
