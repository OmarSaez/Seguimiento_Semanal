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

/**
 * Servicio encargado de la generación, estructuración y exportación de reportes en formato Excel (.xlsx).
 * <p>
 * Este servicio utiliza internamente la librería Apache POI para iterar sobre la data relacional
 * de una Sección (Avances, Alumnos, Detalles) y construir un archivo binario dividido en múltiples hojas
 * de cálculo. Cada hoja representa una perspectiva distinta orientada al control de gestión docente:
 * <ul>
 *     <li><b>Reportes Detallados:</b> Muestra el desglose cronológico y lineal de cada avance enviado.</li>
 *     <li><b>Resumen por Proyecto:</b> Agrupa las horas humanas sumadas en los proyectos y renderiza gráficos XY interactivos.</li>
 *     <li><b>Analítica y Responsabilidad:</b> Genera KPI críticos de cumplimiento, promedios de retraso, entregas de golpe y ratios de compromiso.</li>
 *     <li><b>Horas por Actividad:</b> Desglosa la asignación técnica de horas de cada alumno y proyecto segmentando por tipo de tarea (Diseño, Testing, QA, etc), e identifica ausencias de reporte.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class ExcelService {

    private final AdvanceRepository advanceRepository;
    private final SectionRepository sectionRepository;
    private final StudentRepository studentRepository;

    /**
     * Orquesta la generación del Excel obteniendo los datos desde la BD (Sección, Alumnos y Avances)
     * y llama de manera seriada a los sub-métodos que construyen las hojas.
     * @return El archivo binario de Excel listo para descarga.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'HELPER')")
    public byte[] generateSectionExcel(Long sectionId) throws IOException {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Sección no encontrada"));

        List<Advance> advances = advanceRepository.findByProyectSectionIdOrderBySendDateDesc(sectionId);
        List<Student> allStudents = studentRepository.findBySectionId(sectionId);

        try (Workbook workbook = new XSSFWorkbook()) {
            createRawDataSheet(workbook, advances);

            createAnalyticsSheet(workbook, advances, section, allStudents);
            createActivityAnalysisSheet(workbook, advances, section, allStudents);
            createCommitmentTrackingSheet(workbook, advances, section, allStudents);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    /**
     * Empaqueta el conjunto de reportes en Excel de todas las secciones vinculadas a un Profesor en un único archivo ZIP.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'HELPER')")
    public byte[] generateAllSectionsZip(String teacherEmail) throws IOException {
        List<Section> sections = sectionRepository.findByTeacherEmailOrderByYearDescSemesterDesc(teacherEmail);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos)) {
            for (Section section : sections) {
                byte[] excelData = generateSectionExcel(section.getId());
                String filename = "Reporte_AvanceSemanal_" + section.getSectionCode() + "_" + section.getSemester() + "-" + section.getYear() + ".xlsx";
                java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(filename);
                zos.putNextEntry(zipEntry);
                zos.write(excelData);
                zos.closeEntry();
            }
        }
        return baos.toByteArray();
    }

    /**
     * Empaqueta el conjunto de reportes en Excel de las secciones seleccionadas en un único archivo ZIP.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'HELPER')")
    public byte[] generateSelectedSectionsZip(List<Long> sectionIds) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos)) {
            for (Long sectionId : sectionIds) {
                Optional<Section> sectionOpt = sectionRepository.findById(sectionId);
                if (sectionOpt.isPresent()) {
                    Section section = sectionOpt.get();
                    byte[] excelData = generateSectionExcel(section.getId());
                    String filename = "Reporte_AvanceSemanal_" + section.getSectionCode() + "_" + section.getSemester() + "-" + section.getYear() + ".xlsx";
                    java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(filename);
                    zos.putNextEntry(zipEntry);
                    zos.write(excelData);
                    zos.closeEntry();
                }
            }
        }
        return baos.toByteArray();
    }

    /**
     * Hoja 1: Construye la tabla de reporte plano.
     * Itera por todos los avances histórios para mostrar cada Detalle por fila (Actividad v/s HH).
     */
    private void createRawDataSheet(Workbook workbook, List<Advance> advances) {
        Sheet sheet = workbook.createSheet("Reportes Detallados");
        String[] headers = {
            "Fecha Envío", "Alumno", "Email", "Proyecto", "Semana", "Lunes de la Semana",
            "Actividad Realizada", "Horas (HH)", "Contexto/Detalle", 
            "Problemas Reportados", "Solución / Acción", "Actividad Planeada Futura", "Detalle Planeado Futuro"
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
        DateTimeFormatter dateOnlyFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Advance advance : advances) {
            String studentName = advance.getStudent().getName() + " " + advance.getStudent().getLastname();
            String studentEmail = advance.getStudent().getEmail();
            String projectName = advance.getProyect().getName();
            String sendDate = advance.getSendDate() != null ? advance.getSendDate().format(formatter) : "N/A";
            
            String mondayDate = "N/A";
            if (advance.getStudent() != null && advance.getStudent().getSection() != null) {
                java.time.LocalDate sectionStart = advance.getStudent().getSection().getStartDate();
                if (sectionStart != null && advance.getNumberWeek() != null) {
                    java.time.LocalDate startMonday = sectionStart.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                    java.time.LocalDate reportedWeekMonday = startMonday.plusWeeks(advance.getNumberWeek() - 1);
                    mondayDate = reportedWeekMonday.format(dateOnlyFormatter);
                }
            }

            String problems = cleanValue(advance.getProblem());
            String solution = cleanValue(advance.getSolution());

            // 1. Actividades realizadas
            for (AdvanceDetail detail : advance.getDetails()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sendDate);
                row.createCell(1).setCellValue(studentName);
                row.createCell(2).setCellValue(studentEmail);
                row.createCell(3).setCellValue(projectName);
                row.createCell(4).setCellValue("Semana " + advance.getNumberWeek());
                row.createCell(5).setCellValue(mondayDate);
                row.createCell(6).setCellValue(detail.getTypeAdvance());
                row.createCell(7).setCellValue(detail.getHh() != null ? detail.getHh() : 0);
                row.createCell(8).setCellValue(detail.getContext() != null && !detail.getContext().trim().isEmpty() ? detail.getContext().trim() : "n/r");
                row.createCell(9).setCellValue("n/r");
                row.createCell(10).setCellValue("n/r");
                row.createCell(11).setCellValue("n/r");
                row.createCell(12).setCellValue("n/r");
            }

            // 2. Problemas / riesgos reportados
            Row probRow = sheet.createRow(rowIdx++);
            probRow.createCell(0).setCellValue(sendDate);
            probRow.createCell(1).setCellValue(studentName);
            probRow.createCell(2).setCellValue(studentEmail);
            probRow.createCell(3).setCellValue(projectName);
            probRow.createCell(4).setCellValue("Semana " + advance.getNumberWeek());
            probRow.createCell(5).setCellValue(mondayDate);
            probRow.createCell(6).setCellValue("Problemas/riesgos reportados");
            probRow.createCell(7).setCellValue("n/r");
            probRow.createCell(8).setCellValue("n/r");
            probRow.createCell(9).setCellValue(problems);
            probRow.createCell(10).setCellValue(solution);
            probRow.createCell(11).setCellValue("n/r");
            probRow.createCell(12).setCellValue("n/r");

            // 3. Actividades futuras planeadas
            if (advance.getFutureAdvances() != null && !advance.getFutureAdvances().isEmpty()) {
                for (AdvanceFuture future : advance.getFutureAdvances()) {
                    Row futRow = sheet.createRow(rowIdx++);
                    futRow.createCell(0).setCellValue(sendDate);
                    futRow.createCell(1).setCellValue(studentName);
                    futRow.createCell(2).setCellValue(studentEmail);
                    futRow.createCell(3).setCellValue(projectName);
                    futRow.createCell(4).setCellValue("Semana " + advance.getNumberWeek());
                    futRow.createCell(5).setCellValue(mondayDate);
                    futRow.createCell(6).setCellValue("n/r");
                    futRow.createCell(7).setCellValue("n/r");
                    futRow.createCell(8).setCellValue("n/r");
                    futRow.createCell(9).setCellValue("n/r");
                    futRow.createCell(10).setCellValue("n/r");
                    futRow.createCell(11).setCellValue(future.getTypeAdvance() != null ? future.getTypeAdvance() : "n/r");
                    futRow.createCell(12).setCellValue(future.getContext() != null && !future.getContext().trim().isEmpty() ? future.getContext().trim() : "n/r");
                }
            } else {
                Row futRow = sheet.createRow(rowIdx++);
                futRow.createCell(0).setCellValue(sendDate);
                futRow.createCell(1).setCellValue(studentName);
                futRow.createCell(2).setCellValue(studentEmail);
                futRow.createCell(3).setCellValue(projectName);
                futRow.createCell(4).setCellValue("Semana " + advance.getNumberWeek());
                futRow.createCell(5).setCellValue(mondayDate);
                futRow.createCell(6).setCellValue("n/r");
                futRow.createCell(7).setCellValue("n/r");
                futRow.createCell(8).setCellValue("n/r");
                futRow.createCell(9).setCellValue("n/r");
                futRow.createCell(10).setCellValue("n/r");
                futRow.createCell(11).setCellValue("n/r");
                futRow.createCell(12).setCellValue("n/r");
            }
        }

        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    /**
     * Hoja 2: Construye el resumen general englobando variables de esfuerzo a nivel grupal.
     * Además dibuja con Apache POI un gráfico lineal para comparar la dedicación por semanas (HH).
     */
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

        List<Proyect> sectionProjects = section.getProyects() != null ? section.getProyects() : new ArrayList<>();

        Map<Long, List<Advance>> projectAdvancesMap = advances.stream()
                .collect(Collectors.groupingBy(a -> a.getProyect().getId()));

        Map<Long, List<Student>> projectStudentsMap = allStudents.stream()
                .filter(s -> s.getProyect() != null)
                .collect(Collectors.groupingBy(s -> s.getProyect().getId()));

        int rowIdx = 3;
        
        for (Proyect project : sectionProjects) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(project.getName());
            
            List<Advance> projAdvances = projectAdvancesMap.getOrDefault(project.getId(), new ArrayList<>());
            List<Student> projStudents = projectStudentsMap.getOrDefault(project.getId(), new ArrayList<>());
            
            double totalHh = projAdvances.stream()
                    .flatMap(a -> a.getDetails().stream())
                    .mapToDouble(d -> d.getHh() != null ? d.getHh() : 0.0)
                    .sum();
            
            row.createCell(1).setCellValue(totalHh);
            row.createCell(2).setCellValue(projStudents.size());
            row.createCell(3).setCellValue(projAdvances.size());
        }

        // Students without project assigned
        List<Student> studentsWithoutProject = allStudents.stream()
                .filter(s -> s.getProyect() == null)
                .collect(Collectors.toList());
        if (!studentsWithoutProject.isEmpty()) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue("Alumnos sin proyecto asignado");
            row.createCell(1).setCellValue(0);
            row.createCell(2).setCellValue(studentsWithoutProject.size());
            row.createCell(3).setCellValue(0);
        }

        int maxWeek = advances.stream().mapToInt(Advance::getNumberWeek).max().orElse(1);
        
        int chartDataRowIdx = rowIdx + 2;
        Row chartHeaderRow = sheet.createRow(chartDataRowIdx++);
        chartHeaderRow.createCell(0).setCellValue("Proyecto / Semana");
        for (int i = 1; i <= maxWeek; i++) chartHeaderRow.createCell(i).setCellValue("Sem " + i);

        for (Proyect project : sectionProjects) {
            Row row = sheet.createRow(chartDataRowIdx++);
            row.createCell(0).setCellValue(project.getName());
            List<Advance> projAds = projectAdvancesMap.getOrDefault(project.getId(), new ArrayList<>());
            for (int w = 1; w <= maxWeek; w++) {
                int finalW = w;
                double hhWeek = projAds.stream()
                        .filter(a -> a.getNumberWeek() == finalW)
                        .flatMap(a -> a.getDetails().stream())
                        .mapToDouble(d -> d.getHh() != null ? d.getHh() : 0.0)
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

        for (int i = 0; i < sectionProjects.size(); i++) {
            XDDFNumericalDataSource<Double> hhSource = XDDFDataSourcesFactory.fromNumericCellRange(sheet, 
                    new CellRangeAddress(rowIdx + 3 + i, rowIdx + 3 + i, 1, maxWeek));
            XDDFLineChartData.Series series = (XDDFLineChartData.Series) data.addSeries(weeksSource, hhSource);
            series.setTitle(sectionProjects.get(i).getName(), null);
            series.setSmooth(false);
            series.setMarkerStyle(MarkerStyle.CIRCLE);
        }
        chart.plot(data);
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    /**
     * Hoja 3: Realiza análisis lógicos calculando cruces y ratios (Cumplimiento, Retrasos, Entregas en Lote).
     * Muestra resúmenes para el profesor de aquellos alumnos en estado de riesgo o ausentes.
     */
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

    /**
     * Utilidad que construye el estilo visual base para las celdas de encabezado principal (Gris/Azul y texto Blanco en negrita).
     */
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

    /**
     * Hoja 4: Cruza por Tipo de Tarea ("Diseño", "QA", etc.) mostrando cuantas horas 
     * aplicó el Alumno en la matriz de su respectivo Proyecto. También segrega alumnos "sin reporte".
     */
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
                
                Map<String, Double> hhByType = studEntry.getValue().stream()
                        .flatMap(a -> a.getDetails().stream())
                        .collect(Collectors.groupingBy(AdvanceDetail::getTypeAdvance, Collectors.summingDouble(d -> d.getHh() != null ? d.getHh() : 0.0)));

                double totalHhIndividual = 0.0;
                for (int i = 0; i < ACTIVITY_TYPES.size(); i++) {
                    double hh = hhByType.getOrDefault(ACTIVITY_TYPES.get(i), 0.0);
                    row.createCell(i + 2).setCellValue(hh);
                    totalHhIndividual += hh;
                }
                row.createCell(ACTIVITY_TYPES.size() + 2).setCellValue(totalHhIndividual);
            }
        }

        // ALUMNOS QUE NO HAN REPORTADO NADA Y SE IGNORA SU PROYECTO
        Set<String> activeEmails = advances.stream().map(a -> a.getStudent().getEmail()).collect(Collectors.toSet());
        List<Student> missingStudents = allStudents.stream()
                .filter(s -> !activeEmails.contains(s.getEmail()))
                .collect(Collectors.toList());

        for (Student student : missingStudents) {
            Row row = sheet.createRow(rowIdx++);
            String projectName = student.getProyect() != null 
                    ? student.getProyect().getCode() + " - " + student.getProyect().getName()
                    : "Sin proyecto asignado";
            String studentName = student.getName() + " " + student.getLastname();
            
            row.createCell(0).setCellValue(projectName);
            row.createCell(1).setCellValue(studentName);
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

        List<Proyect> sectionProjects = section.getProyects() != null ? section.getProyects() : new ArrayList<>();
        Map<Long, List<Advance>> projectAdvancesMap = advances.stream()
                .collect(Collectors.groupingBy(a -> a.getProyect().getId()));

        for (Proyect project : sectionProjects) {
            Row row = sheet.createRow(rowIdx++);
            String projectName = project.getCode() + " - " + project.getName();
            row.createCell(0).setCellValue(projectName);
            
            List<Advance> projAdvances = projectAdvancesMap.getOrDefault(project.getId(), new ArrayList<>());
            Map<String, Double> hhByType = projAdvances.stream()
                    .flatMap(a -> a.getDetails().stream())
                    .collect(Collectors.groupingBy(AdvanceDetail::getTypeAdvance, Collectors.summingDouble(d -> d.getHh() != null ? d.getHh() : 0.0)));

            double totalHhProject = 0.0;
            for (int i = 0; i < ACTIVITY_TYPES.size(); i++) {
                double hh = hhByType.getOrDefault(ACTIVITY_TYPES.get(i), 0.0);
                row.createCell(i + 1).setCellValue(hh);
                totalHhProject += hh;
            }
            row.createCell(ACTIVITY_TYPES.size() + 1).setCellValue(totalHhProject);
        }

        for (int i = 0; i < ACTIVITY_TYPES.size() + 3; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    /**
     * Hoja 5: Construye la pestaña "Seguimiento de Compromisos".
     * Muestra una matriz comparativa horizontal que contrasta las actividades planificadas
     * (comprometidas) en la semana anterior (W-1) frente a las realmente ejecutadas en la
     * semana actual (W). Combina verticalmente las celdas de Proyecto y Alumno, desglosando
     * los 7 tipos de actividad en filas consecutivas para una fácil auditoría visual.
     */
    private void createCommitmentTrackingSheet(Workbook workbook, List<Advance> advances, Section section, List<Student> allStudents) {
        Sheet sheet = workbook.createSheet("Seguimiento de Compromisos");
        
        List<String> ACTIVITY_TYPES = Arrays.asList(
            "Coordinacion/Planificacion",
            "Reuniones con cliente",
            "Diseño/Desarrollo de Software",
            "Instalaciones/Despliegue",
            "Pruebas/QA",
            "Documentacion",
            "Entrega/Capacitacion"
        );

        // Find max week in the advances
        int maxWeek = advances.stream().mapToInt(Advance::getNumberWeek).max().orElse(1);
        if (maxWeek < 1) maxWeek = 1;

        // Cell styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        
        CellStyle subHeaderStyle = workbook.createCellStyle();
        subHeaderStyle.cloneStyleFrom(headerStyle);
        subHeaderStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        subHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font subFont = workbook.createFont();
        subFont.setBold(true);
        subFont.setColor(IndexedColors.BLACK.getIndex());
        subHeaderStyle.setFont(subFont);

        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setWrapText(true);
        dataStyle.setVerticalAlignment(VerticalAlignment.TOP);
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);

        CellStyle alignCenterStyle = workbook.createCellStyle();
        alignCenterStyle.cloneStyleFrom(dataStyle);
        alignCenterStyle.setAlignment(HorizontalAlignment.CENTER);
        alignCenterStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        // Header Rows: Row 0 and Row 1
        Row row0 = sheet.createRow(0);
        Row row1 = sheet.createRow(1);

        // Column headers
        Cell c0 = row0.createCell(0); c0.setCellValue("Proyecto"); c0.setCellStyle(headerStyle);
        Cell c1 = row0.createCell(1); c1.setCellValue("Alumno"); c1.setCellStyle(headerStyle);
        Cell c2 = row0.createCell(2); c2.setCellValue("Actividad"); c2.setCellStyle(headerStyle);

        // Create empty cells in row 1 for columns 0, 1, 2
        row1.createCell(0).setCellStyle(headerStyle);
        row1.createCell(1).setCellStyle(headerStyle);
        row1.createCell(2).setCellStyle(headerStyle);

        // Merge Row 0 and Row 1 vertically for columns 0, 1, 2
        sheet.addMergedRegion(new CellRangeAddress(0, 1, 0, 0));
        sheet.addMergedRegion(new CellRangeAddress(0, 1, 1, 1));
        sheet.addMergedRegion(new CellRangeAddress(0, 1, 2, 2));

        // Create headers for each week
        for (int w = 1; w <= maxWeek; w++) {
            int colStart = 3 + (w - 1) * 2;
            int colEnd = colStart + 1;

            // Week label in row 0
            Cell weekCell = row0.createCell(colStart);
            weekCell.setCellValue("Semana " + w);
            weekCell.setCellStyle(headerStyle);
            row0.createCell(colEnd).setCellStyle(headerStyle);

            // Merge horizontally for Semana W
            sheet.addMergedRegion(new CellRangeAddress(0, 0, colStart, colEnd));

            // Subheaders: Comprometido and Realizado in row 1
            Cell compCell = row1.createCell(colStart);
            compCell.setCellValue("Comprometido (Planificado en Sem " + (w - 1) + ")");
            compCell.setCellStyle(subHeaderStyle);

            Cell realCell = row1.createCell(colEnd);
            realCell.setCellValue("Realizado (Hecho en Sem " + w + ")");
            realCell.setCellStyle(subHeaderStyle);
        }

        // Group students by project name to avoid null or transient project references
        Map<String, List<Student>> projectStudentsMap = new HashMap<>();
        for (Student s : allStudents) {
            String key = "Sin proyecto asignado";
            if (s.getProyect() != null) {
                key = (s.getProyect().getCode() != null ? s.getProyect().getCode() : "S/P") + " - " + s.getProyect().getName();
            }
            projectStudentsMap.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }

        List<String> sortedProjectNames = new ArrayList<>(projectStudentsMap.keySet());
        sortedProjectNames.sort((p1, p2) -> {
            if (p1.equals("Sin proyecto asignado")) return 1;
            if (p2.equals("Sin proyecto asignado")) return -1;
            return p1.compareTo(p2);
        });

        int currentRowIdx = 2;

        for (String projectName : sortedProjectNames) {
            List<Student> studentsInProject = projectStudentsMap.get(projectName);
            studentsInProject.sort(Comparator.comparing(s -> s.getName() + " " + s.getLastname()));

            int projectStartRow = currentRowIdx;
            int totalProjectRows = studentsInProject.size() * ACTIVITY_TYPES.size();

            if (totalProjectRows == 0) continue;

            for (Student student : studentsInProject) {
                int studentStartRow = currentRowIdx;
                int totalStudentRows = ACTIVITY_TYPES.size();

                // Get all advances of the student, sorted by week
                List<Advance> studentAdvances = advances.stream()
                        .filter(a -> a.getStudent().getId().equals(student.getId()))
                        .collect(Collectors.toList());

                // Create a map from week number to Advance for fast access
                Map<Integer, Advance> weekAdvanceMap = studentAdvances.stream()
                        .collect(Collectors.toMap(Advance::getNumberWeek, a -> a, (a1, a2) -> a1));

                for (String activityType : ACTIVITY_TYPES) {
                    Row row = sheet.createRow(currentRowIdx);

                    Cell projectCell = row.createCell(0);
                    projectCell.setCellValue(projectName);
                    projectCell.setCellStyle(alignCenterStyle);

                    Cell studentCell = row.createCell(1);
                    studentCell.setCellValue(student.getName() + " " + student.getLastname());
                    studentCell.setCellStyle(alignCenterStyle);

                    Cell activityCell = row.createCell(2);
                    activityCell.setCellValue(activityType);
                    activityCell.setCellStyle(dataStyle);

                    // Now populate weekly data
                    for (int w = 1; w <= maxWeek; w++) {
                        int colStart = 3 + (w - 1) * 2;
                        int colEnd = colStart + 1;

                        Cell compCell = row.createCell(colStart);
                        compCell.setCellStyle(dataStyle);

                        Cell realCell = row.createCell(colEnd);
                        realCell.setCellStyle(dataStyle);

                        // 1. Comprometido for week w: Look at week w - 1 future advances
                        if (w > 1) {
                            Advance prevAdvance = weekAdvanceMap.get(w - 1);
                            if (prevAdvance != null && prevAdvance.getFutureAdvances() != null) {
                                String compText = prevAdvance.getFutureAdvances().stream()
                                        .filter(fa -> fa.getTypeAdvance().equalsIgnoreCase(activityType))
                                        .map(fa -> cleanValue(fa.getContext()))
                                        .filter(txt -> !txt.equals("n/r"))
                                        .collect(Collectors.joining("\n"));
                                compCell.setCellValue(compText.isEmpty() ? "n/r" : compText);
                            } else {
                                compCell.setCellValue("n/r");
                            }
                        } else {
                            compCell.setCellValue("N/A"); // Week 1 commitment would come from week 0, which doesn't exist
                        }

                        // 2. Realizado for week w: Look at week w actual details
                        Advance currentAdvance = weekAdvanceMap.get(w);
                        if (currentAdvance != null && currentAdvance.getDetails() != null) {
                            String realText = currentAdvance.getDetails().stream()
                                    .filter(d -> d.getTypeAdvance().equalsIgnoreCase(activityType))
                                    .map(d -> {
                                        String ctx = cleanValue(d.getContext());
                                        Double hours = d.getHh();
                                        String hoursStr = (hours != null) ? hours.toString() : "0";
                                        if (hoursStr.endsWith(".0")) {
                                            hoursStr = hoursStr.substring(0, hoursStr.length() - 2);
                                        }
                                        return ctx.equals("n/r") ? "n/r" : ctx + " (" + hoursStr + " hrs)";
                                    })
                                    .filter(txt -> !txt.equals("n/r"))
                                    .collect(Collectors.joining("\n"));
                            realCell.setCellValue(realText.isEmpty() ? "n/r" : realText);
                        } else {
                            realCell.setCellValue("n/r");
                        }
                    }

                    currentRowIdx++;
                }

                // Merge student column (col 1) vertically for the 7 activity types
                sheet.addMergedRegion(new CellRangeAddress(studentStartRow, studentStartRow + totalStudentRows - 1, 1, 1));
            }

            // Merge project column (col 0) vertically for all student-activity rows in this project
            sheet.addMergedRegion(new CellRangeAddress(projectStartRow, projectStartRow + totalProjectRows - 1, 0, 0));
        }

        // Set column widths
        for (int i = 0; i < 3 + maxWeek * 2; i++) {
            if (i >= 3) {
                sheet.setColumnWidth(i, 8000);
            } else if (i == 0 || i == 1) {
                sheet.setColumnWidth(i, 6000);
            } else {
                sheet.setColumnWidth(i, 7000);
            }
        }
    }

    private String cleanValue(String val) {
        if (val == null) return "n/r";
        String clean = val.trim();
        if (clean.isEmpty()) return "n/r";
        String lower = clean.toLowerCase();
        if (lower.equals("ninguno") || lower.equals("ninguna") || lower.equals("ninguno.") || lower.equals("ninguna.")) {
            return "n/r";
        }
        return clean;
    }
}
