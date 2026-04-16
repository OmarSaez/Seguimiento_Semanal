package com.seguimiento.semanal.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

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
