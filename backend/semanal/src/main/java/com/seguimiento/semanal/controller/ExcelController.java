package com.seguimiento.semanal.controller;

import com.seguimiento.semanal.service.ExcelService;
import com.seguimiento.semanal.repository.SectionRepository;
import com.seguimiento.semanal.entity.Section;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ExcelController {

    private final ExcelService excelService;
    private final SectionRepository sectionRepository;

    @GetMapping("/section/{sectionId}/excel")
    public ResponseEntity<byte[]> downloadSectionExcel(@PathVariable Long sectionId) {
        try {
            Section section = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new RuntimeException("Sección no encontrada"));

            byte[] data = excelService.generateSectionExcel(sectionId);
            
            // Format: Reporte_AvanceSemanal_SECCION_SEMESTRE-AÑO.xlsx
            String filename = "Reporte_AvanceSemanal_" + section.getSectionCode() + "_" + section.getSemester() + "-" + section.getYear() + ".xlsx";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/teacher/excel-zip")
    public ResponseEntity<byte[]> downloadAllSectionsZip(java.security.Principal principal) {
        try {
            byte[] data = excelService.generateAllSectionsZip(principal.getName());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=TodasSecciones.zip")
                    .contentType(MediaType.parseMediaType("application/zip"))
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
