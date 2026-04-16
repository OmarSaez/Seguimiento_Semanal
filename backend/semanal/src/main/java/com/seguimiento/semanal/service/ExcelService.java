package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.*;
import com.seguimiento.semanal.repository.AdvanceRepository;
import com.seguimiento.semanal.repository.SectionRepository;
import com.seguimiento.semanal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xddf.usermodel.chart.*;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final AdvanceRepository advanceRepository;
    private final SectionRepository sectionRepository;
    private final StudentRepository studentRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public byte[] generateSectionExcel(Long sectionId) throws IOException {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Sección no encontrada"));

        List<Advance> advances = advanceRepository.findByProyectSectionIdOrderBySendDateDesc(sectionId);
        List<Student> allStudents = studentRepository.findBySectionId(sectionId);

        try (Workbook workbook = new XSSFWorkbook()) {
            createRawDataSheet(workbook, advances);
            createProjectSummarySheet(workbook, advances, section, allStudents);
            createAnalyticsSheet(workbook, advances, section, allStudents);
            createActivityAnalysisSheet(workbook, advances, section, allStudents);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private void createRawDataSheet(Workbook workbook, List<Advance> advances) {
        Sheet sheet = workbook.createSheet("Reportes Detallados");
        String[] headers = {
            "Fecha Envío", "Alumno", "Email", "Proyecto", "Semana", 
            "Actividad Realizada", "Contexto/Detalle", "Horas (HH)", 
            "Problemas Reportados", "Actividades Planeadas Futuras"
        };

        CellStyle headerStyle = createHeaderStyle(workbook);
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (Advance advance : advances) {
            String studentName = advance.getStudent().getName() + " " + advance.getStudent().getLastname();
            String studentEmail = advance.getStudent().getEmail();
            String projectName = advance.getProyect().getName();
            String sendDate = advance.getSendDate() != null ? advance.getSendDate().format(formatter) : "N/A";
            String problems = advance.getProblem();
            
            String futurePlanned = advance.getFutureAdvances().stream()
                    .map(AdvanceFuture::getTypeAdvance)
                    .collect(Collectors.joining(", "));

            for (AdvanceDetail detail : advance.getDetails()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sendDate);
                row.createCell(1).setCellValue(studentName);
                row.createCell(2).setCellValue(studentEmail);
                row.createCell(3).setCellValue(projectName);
                row.createCell(4).setCellValue("Semana " + advance.getNumberWeek());
                row.createCell(5).setCellValue(detail.getTypeAdvance());
                row.createCell(6).setCellValue(detail.getContext());
                row.createCell(7).setCellValue(detail.getHh() != null ? detail.getHh() : 0);
                row.createCell(8).setCellValue(problems);
                row.createCell(9).setCellValue(futurePlanned);
            }
        }

        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    private void createProjectSummarySheet(Workbook workbook, List<Advance> advances, Section section, List<Student> allStudents) {
        XSSFSheet sheet = (XSSFSheet) workbook.createSheet("Resumen por Proyecto");
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("TOTAL HH POR PROYECTO - " + section.getSectionCode());
        titleCell.setCellStyle(createHeaderStyle(workbook));

        Row headerRow = sheet.createRow(2);
        headerRow.createCell(0).setCellValue("Nombre del Proyecto");
        headerRow.createCell(1).setCellValue("Total HH Acumuladas");
        headerRow.createCell(2).setCellValue("N° de Alumnos");
        headerRow.createCell(3).setCellValue("Reportes Enviados");

        headerRow.getCell(0).setCellStyle(createHeaderStyle(workbook));
        headerRow.getCell(1).setCellStyle(createHeaderStyle(workbook));
        headerRow.getCell(2).setCellStyle(createHeaderStyle(workbook));
        headerRow.getCell(3).setCellStyle(createHeaderStyle(workbook));

        Map<String, List<Advance>> projectMap = advances.stream()
                .collect(Collectors.groupingBy(a -> a.getProyect().getName()));

        int rowIdx = 3;
        long totalStudentsHandled = 0;
        
        for (Map.Entry<String, List<Advance>> entry : projectMap.entrySet()) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(entry.getKey());
            int totalHh = entry.getValue().stream()
                    .flatMap(a -> a.getDetails().stream())
                    .mapToInt(d -> d.getHh() != null ? d.getHh() : 0)
                    .sum();
            long studentCount = entry.getValue().stream()
                    .map(a -> a.getStudent().getId())
                    .distinct()
                    .count();
            row.createCell(1).setCellValue(totalHh);
            row.createCell(2).setCellValue(studentCount);
            row.createCell(3).setCellValue(entry.getValue().size());
            totalStudentsHandled += studentCount;
        }

        long totalEnrolledStudents = allStudents.size();
        long ghostCount = totalEnrolledStudents - totalStudentsHandled;
        if (ghostCount > 0) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue("Alumnos sin reportes");
            row.createCell(1).setCellValue(0);
            row.createCell(2).setCellValue(ghostCount);
            row.createCell(3).setCellValue(0);
        }

        int maxWeek = advances.stream().mapToInt(Advance::getNumberWeek).max().orElse(1);
        List<String> projectList = new ArrayList<>(projectMap.keySet());
        
        int chartDataRowIdx = rowIdx + 2;
        Row chartHeaderRow = sheet.createRow(chartDataRowIdx++);
        chartHeaderRow.createCell(0).setCellValue("Proyecto / Semana");
        for (int i = 1; i <= maxWeek; i++) chartHeaderRow.createCell(i).setCellValue("Sem " + i);

        for (String projName : projectList) {
            Row row = sheet.createRow(chartDataRowIdx++);
            row.createCell(0).setCellValue(projName);
            List<Advance> projAds = projectMap.get(projName);
            for (int w = 1; w <= maxWeek; w++) {
                int finalW = w;
                int hhWeek = projAds.stream()
                        .filter(a -> a.getNumberWeek() == finalW)
                        .flatMap(a -> a.getDetails().stream())
                        .mapToInt(d -> d.getHh() != null ? d.getHh() : 0)
                        .sum();
                row.createCell(w).setCellValue(hhWeek);
            }
        }

        XSSFDrawing drawing = sheet.createDrawingPatriarch();
        XSSFClientAnchor anchor = drawing.createAnchor(0, 0, 0, 0, 5, 2, 15, 18);
        XSSFChart chart = drawing.createChart(anchor);
        chart.setTitleText("HH Invertidas por Proyecto y Semana");
        chart.setTitleOverlay(false);
        XDDFChartLegend legend = chart.getOrAddLegend();
        legend.setPosition(LegendPosition.TOP_RIGHT);

        XDDFCategoryAxis bottomAxis = chart.createCategoryAxis(AxisPosition.BOTTOM);
        bottomAxis.setTitle("Semanas");
        XDDFValueAxis leftAxis = chart.createValueAxis(AxisPosition.LEFT);
        leftAxis.setTitle("Horas Humanas (HH)");

        XDDFDataSource<String> weeksSource = XDDFDataSourcesFactory.fromStringCellRange(sheet, 
                new CellRangeAddress(rowIdx + 2, rowIdx + 2, 1, maxWeek));

        XDDFLineChartData data = (XDDFLineChartData) chart.createData(ChartTypes.LINE, bottomAxis, leftAxis);

        for (int i = 0; i < projectList.size(); i++) {
            XDDFNumericalDataSource<Double> hhSource = XDDFDataSourcesFactory.fromNumericCellRange(sheet, 
                    new CellRangeAddress(rowIdx + 3 + i, rowIdx + 3 + i, 1, maxWeek));
            XDDFLineChartData.Series series = (XDDFLineChartData.Series) data.addSeries(weeksSource, hhSource);
            series.setTitle(projectList.get(i), null);
            series.setSmooth(false);
            series.setMarkerStyle(MarkerStyle.CIRCLE);
        }
        chart.plot(data);
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createAnalyticsSheet(Workbook workbook, List<Advance> advances, Section section, List<Student> allStudents) {
        Sheet sheet = workbook.createSheet("Analítica y Responsabilidad");
        
        // --- 0. RESUMEN GENERAL (GLOBAL KPIs) ---
        Row globalHeader = sheet.createRow(0);
        globalHeader.createCell(0).setCellValue("RESUMEN GENERAL DE LA SECCIÓN");
        globalHeader.getCell(0).setCellStyle(createHeaderStyle(workbook));
        
        Map<Long, List<Advance>> studentAdvancesMap = advances.stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getId()));
        
        int totalEnrolled = allStudents.size();
        int currentAcademicWeek = 1;
        if (section.getStartDate() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(section.getStartDate(), java.time.LocalDate.now());
            currentAcademicWeek = (int) (days / 7) + 1;
        }

        int totalDelay = 0;
        int studentsWithBatch = 0;
        List<Double> fulfillments = new ArrayList<>();

        for (Student student : allStudents) {
            List<Advance> studentAds = studentAdvancesMap.getOrDefault(student.getId(), new ArrayList<>());
            int lastWeek = studentAds.stream().mapToInt(Advance::getNumberWeek).max().orElse(0);
            totalDelay += Math.max(0, currentAcademicWeek - 1 - lastWeek);

            boolean hasBatch = false;
            List<Advance> sortedByDate = studentAds.stream().sorted(Comparator.comparing(Advance::getSendDate)).collect(Collectors.toList());
            for (int i = 0; i < sortedByDate.size() - 1; i++) {
                if (sortedByDate.get(i).getSendDate().plusMinutes(10).isAfter(sortedByDate.get(i+1).getSendDate())) {
                    hasBatch = true; break;
                }
            }
            if (hasBatch) studentsWithBatch++;

            int totalPromises = 0; int keptPromises = 0;
            List<Advance> sortedByWeek = studentAds.stream().sorted(Comparator.comparing(Advance::getNumberWeek)).collect(Collectors.toList());
            for (int i = 0; i < sortedByWeek.size() - 1; i++) {
                Set<String> future = sortedByWeek.get(i).getFutureAdvances().stream()
                        .map(f -> f.getTypeAdvance().trim().toLowerCase()).collect(Collectors.toSet());
                Set<String> done = sortedByWeek.get(i + 1).getDetails().stream()
                        .map(d -> d.getTypeAdvance().trim().toLowerCase()).collect(Collectors.toSet());
                totalPromises += future.size();
                for (String p : future) if (done.contains(p)) keptPromises++;
            }
            if (totalPromises > 0) fulfillments.add((double) keptPromises / totalPromises);
        }

        double avgReports = (double) advances.size() / Math.max(1, totalEnrolled);
        double avgDelay = (double) totalDelay / Math.max(1, totalEnrolled);
        double avgFulfillment = fulfillments.stream().mapToDouble(d -> d).average().orElse(0.0);
        double pctBatch = (double) studentsWithBatch / Math.max(1, totalEnrolled);

        sheet.createRow(1).createCell(0).setCellValue("Total Alumnos:"); sheet.getRow(1).createCell(1).setCellValue(totalEnrolled);
        
        CellStyle decimalStyle = workbook.createCellStyle();
        decimalStyle.setDataFormat(workbook.createDataFormat().getFormat("0.0"));

        sheet.createRow(2).createCell(0).setCellValue("Promedio de reportes entregados:"); 
        Cell reportsCell = sheet.getRow(2).createCell(1);
        reportsCell.setCellValue(avgReports);
        reportsCell.setCellStyle(decimalStyle);

        sheet.createRow(3).createCell(0).setCellValue("Promedio de semanas de retraso:"); 
        Cell delayCell = sheet.getRow(3).createCell(1);
        delayCell.setCellValue(avgDelay);
        delayCell.setCellStyle(decimalStyle);

        sheet.createRow(4).createCell(0).setCellValue("Cumplimiento Promedio:"); sheet.getRow(4).createCell(1).setCellValue(avgFulfillment);
        CellStyle pctStyleGlobal = workbook.createCellStyle(); pctStyleGlobal.setDataFormat(workbook.createDataFormat().getFormat("0.0%"));
        sheet.getRow(4).getCell(1).setCellStyle(pctStyleGlobal);
        sheet.createRow(5).createCell(0).setCellValue("% Reportes 'De Golpe':"); sheet.getRow(5).createCell(1).setCellValue(pctBatch);
        sheet.getRow(5).getCell(1).setCellStyle(pctStyleGlobal);

        int rowIdx = 8;
        // --- 1. DETALLE DE FRECUENCIA ---
        Row sectionTitle1 = sheet.createRow(rowIdx++);
        sectionTitle1.createCell(0).setCellValue("DETALLE DE FRECUENCIA POR ALUMNO");
        sectionTitle1.getCell(0).setCellStyle(createHeaderStyle(workbook));
        Row header1 = sheet.createRow(rowIdx++);
        header1.createCell(0).setCellValue("Alumno"); header1.createCell(1).setCellValue("Total"); header1.createCell(2).setCellValue("Semanas"); header1.createCell(3).setCellValue("De Golpe");

        for (Student student : allStudents) {
            List<Advance> studentAds = studentAdvancesMap.getOrDefault(student.getId(), new ArrayList<>());
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(student.getName() + " " + student.getLastname());
            row.createCell(1).setCellValue(studentAds.size());
            String weeks = studentAds.stream().map(a -> a.getNumberWeek().toString()).distinct().sorted().collect(Collectors.joining(", "));
            row.createCell(2).setCellValue(weeks.isEmpty() ? "Ninguna" : weeks);
            long batchedCount = 0;
            if (studentAds.size() > 1) {
                List<Advance> sortedByDate = studentAds.stream().sorted(Comparator.comparing(Advance::getSendDate)).collect(Collectors.toList());
                for (int i = 0; i < sortedByDate.size() - 1; i++) {
                    if (sortedByDate.get(i).getSendDate().plusMinutes(10).isAfter(sortedByDate.get(i+1).getSendDate())) {
                        batchedCount++;
                    }
                }
            }
            row.createCell(3).setCellValue(batchedCount > 0 ? "SÍ (" + (batchedCount + 1) + " seguidos)" : "No");
        }

        rowIdx += 2;
        // --- 2. ANÁLISIS DE REZAGO ---
        Row sectionTitle3 = sheet.createRow(rowIdx++);
        sectionTitle3.createCell(0).setCellValue("ALUMNOS CON TRABAJO PENDIENTE (RETRASOS)");
        sectionTitle3.getCell(0).setCellStyle(createHeaderStyle(workbook));
        Row header3 = sheet.createRow(rowIdx++);
        header3.createCell(0).setCellValue("Alumno"); header3.createCell(1).setCellValue("Actual"); header3.createCell(2).setCellValue("Última"); header3.createCell(3).setCellValue("Retraso");

        for (Student student : allStudents) {
            List<Advance> studentAds = studentAdvancesMap.getOrDefault(student.getId(), new ArrayList<>());
            Row row = sheet.createRow(rowIdx++);
            int lastWeek = studentAds.stream().mapToInt(Advance::getNumberWeek).max().orElse(0);
            int delay = Math.max(0, currentAcademicWeek - 1 - lastWeek);
            row.createCell(0).setCellValue(student.getName() + " " + student.getLastname());
            row.createCell(1).setCellValue(currentAcademicWeek);
            row.createCell(2).setCellValue(lastWeek == 0 ? "Ninguna" : "Sem " + lastWeek);
            row.createCell(3).setCellValue(delay);
            if (delay >= 1) {
                CellStyle ds = workbook.createCellStyle(); Font rf = workbook.createFont(); rf.setColor(IndexedColors.RED.getIndex()); rf.setBold(true); ds.setFont(rf);
                row.getCell(3).setCellStyle(ds);
            }
        }

        rowIdx += 2;
        // --- 3. KPI CUMPLIMIENTO ---
        Row sectionTitle2 = sheet.createRow(rowIdx++);
        sectionTitle2.createCell(0).setCellValue("KPI: CUMPLIMIENTO (Compromisos)");
        sectionTitle2.getCell(0).setCellStyle(createHeaderStyle(workbook));
        Row header2 = sheet.createRow(rowIdx++);
        header2.createCell(0).setCellValue("Alumno"); header2.createCell(1).setCellValue("Comp."); header2.createCell(2).setCellValue("Cump."); header2.createCell(3).setCellValue("%");

        for (Student student : allStudents) {
            List<Advance> studentAds = studentAdvancesMap.getOrDefault(student.getId(), new ArrayList<>()).stream()
                    .sorted(Comparator.comparing(Advance::getNumberWeek)).collect(Collectors.toList());
            int totalPromises = 0; int keptPromises = 0;
            for (int i = 0; i < studentAds.size() - 1; i++) {
                Set<String> future = studentAds.get(i).getFutureAdvances().stream().map(f -> f.getTypeAdvance().trim().toLowerCase()).collect(Collectors.toSet());
                Set<String> done = studentAds.get(i + 1).getDetails().stream().map(d -> d.getTypeAdvance().trim().toLowerCase()).collect(Collectors.toSet());
                totalPromises += future.size();
                for (String p : future) if (done.contains(p)) keptPromises++;
            }
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(student.getName() + " " + student.getLastname());
            row.createCell(1).setCellValue(totalPromises);
            row.createCell(2).setCellValue(keptPromises);
            if (totalPromises > 0) {
                double pct = (double) keptPromises / totalPromises;
                row.createCell(3).setCellValue(pct);
                CellStyle ps = workbook.createCellStyle(); ps.setDataFormat(workbook.createDataFormat().getFormat("0.0%"));
                row.getCell(3).setCellStyle(ps);
            } else row.createCell(3).setCellValue("N/A");
        }
        for (int i = 0; i < 4; i++) sheet.autoSizeColumn(i);
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.BLUE_GREY.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private void createActivityAnalysisSheet(Workbook workbook, List<Advance> advances, Section section, List<Student> allStudents) {
        Sheet sheet = workbook.createSheet("Horas por Actividad");
        
        List<String> ACTIVITY_TYPES = Arrays.asList(
            "Coordinacion/Planificacion",
            "Reuniones con cliente",
            "Diseño/Desarrollo de Software",
            "Instalaciones/Despliegue",
            "Pruebas/QA",
            "Documentacion",
            "Entrega/Capacitacion"
        );

        int rowIdx = 0;
        // --- TABLA 1: DESGLOSE INDIVIDUAL ---
        Row title1 = sheet.createRow(rowIdx++);
        title1.createCell(0).setCellValue("DESGLOSE DE HORAS POR ALUMNO Y PROYECTO");
        title1.getCell(0).setCellStyle(createHeaderStyle(workbook));

        Row header1 = sheet.createRow(rowIdx++);
        header1.createCell(0).setCellValue("Proyecto");
        header1.createCell(1).setCellValue("Alumno");
        header1.getCell(0).setCellStyle(createHeaderStyle(workbook));
        header1.getCell(1).setCellStyle(createHeaderStyle(workbook));
        for (int i = 0; i < ACTIVITY_TYPES.size(); i++) {
            header1.createCell(i + 2).setCellValue(ACTIVITY_TYPES.get(i));
            header1.getCell(i + 2).setCellStyle(createHeaderStyle(workbook));
        }
        header1.createCell(ACTIVITY_TYPES.size() + 2).setCellValue("Total HH");
        header1.getCell(ACTIVITY_TYPES.size() + 2).setCellStyle(createHeaderStyle(workbook));

        Map<String, Map<String, List<Advance>>> projectStudentAds = advances.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getProyect().getCode() + " - " + a.getProyect().getName(),
                        Collectors.groupingBy(a -> a.getStudent().getEmail())
                ));

        for (Map.Entry<String, Map<String, List<Advance>>> projEntry : projectStudentAds.entrySet()) {
            String projectName = projEntry.getKey();
            for (Map.Entry<String, List<Advance>> studEntry : projEntry.getValue().entrySet()) {
                String studentName = studEntry.getKey();
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(projectName);
                row.createCell(1).setCellValue(studentName);
                
                Map<String, Integer> hhByType = studEntry.getValue().stream()
                        .flatMap(a -> a.getDetails().stream())
                        .collect(Collectors.groupingBy(AdvanceDetail::getTypeAdvance, Collectors.summingInt(d -> d.getHh() != null ? d.getHh() : 0)));

                int totalHhIndividual = 0;
                for (int i = 0; i < ACTIVITY_TYPES.size(); i++) {
                    int hh = hhByType.getOrDefault(ACTIVITY_TYPES.get(i), 0);
                    row.createCell(i + 2).setCellValue(hh);
                    totalHhIndividual += hh;
                }
                row.createCell(ACTIVITY_TYPES.size() + 2).setCellValue(totalHhIndividual);
            }
        }

        // ALUMNOS QUE NO HAN REPORTADO NADA Y SE IGNORA SU PROYECTO
        Set<String> activeEmails = advances.stream().map(a -> a.getStudent().getEmail()).collect(Collectors.toSet());
        List<String> missingEmails = allStudents.stream()
                .filter(s -> !activeEmails.contains(s.getEmail()))
                .map(Student::getEmail)
                .collect(Collectors.toList());

        for (String email : missingEmails) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue("No se sabe a que grupo pertenece");
            row.createCell(1).setCellValue(email);
            for (int i = 0; i < ACTIVITY_TYPES.size(); i++) {
                row.createCell(i + 2).setCellValue(0);
            }
            row.createCell(ACTIVITY_TYPES.size() + 2).setCellValue(0); // Total HH
        }

        rowIdx += 3;
        
        // --- TABLA 2: DESGLOSE GRUPAL ---
        Row title2 = sheet.createRow(rowIdx++);
        title2.createCell(0).setCellValue("RESUMEN DE HORAS TOTALES POR PROYECTO");
        title2.getCell(0).setCellStyle(createHeaderStyle(workbook));

        Row header2 = sheet.createRow(rowIdx++);
        header2.createCell(0).setCellValue("Proyecto");
        header2.getCell(0).setCellStyle(createHeaderStyle(workbook));
        for (int i = 0; i < ACTIVITY_TYPES.size(); i++) {
            header2.createCell(i + 1).setCellValue(ACTIVITY_TYPES.get(i));
            header2.getCell(i + 1).setCellStyle(createHeaderStyle(workbook));
        }
        header2.createCell(ACTIVITY_TYPES.size() + 1).setCellValue("Total HH");
        header2.getCell(ACTIVITY_TYPES.size() + 1).setCellStyle(createHeaderStyle(workbook));

        Map<String, List<Advance>> projectAds = advances.stream()
                .collect(Collectors.groupingBy(a -> a.getProyect().getCode() + " - " + a.getProyect().getName()));

        for (Map.Entry<String, List<Advance>> projEntry : projectAds.entrySet()) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(projEntry.getKey());
            
            Map<String, Integer> hhByType = projEntry.getValue().stream()
                    .flatMap(a -> a.getDetails().stream())
                    .collect(Collectors.groupingBy(AdvanceDetail::getTypeAdvance, Collectors.summingInt(d -> d.getHh() != null ? d.getHh() : 0)));

            int totalHhProject = 0;
            for (int i = 0; i < ACTIVITY_TYPES.size(); i++) {
                int hh = hhByType.getOrDefault(ACTIVITY_TYPES.get(i), 0);
                row.createCell(i + 1).setCellValue(hh);
                totalHhProject += hh;
            }
            row.createCell(ACTIVITY_TYPES.size() + 1).setCellValue(totalHhProject);
        }

        for (int i = 0; i < ACTIVITY_TYPES.size() + 3; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}
