package com.seguimiento.semanal.service;

import com.seguimiento.semanal.entity.*;
import com.seguimiento.semanal.repository.AdvanceRepository;
import com.seguimiento.semanal.repository.SectionRepository;
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
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final AdvanceRepository advanceRepository;
    private final SectionRepository sectionRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public byte[] generateSectionExcel(Long sectionId) throws IOException {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Sección no encontrada"));

        List<Advance> advances = advanceRepository.findByProyectSectionIdOrderBySendDateDesc(sectionId);

        try (Workbook workbook = new XSSFWorkbook()) {
            createRawDataSheet(workbook, advances);
            createProjectSummarySheet(workbook, advances, section);
            createAnalyticsSheet(workbook, advances, section);

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

        // Estilo de cabecera
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

            // Como un avance puede tener N detalles, creamos una fila por detalle para que sea procesable
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

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createProjectSummarySheet(Workbook workbook, List<Advance> advances, Section section) {
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

        // Agrupar por proyecto
        Map<String, List<Advance>> projectMap = advances.stream()
                .collect(Collectors.groupingBy(a -> a.getProyect().getName()));

        int rowIdx = 3;
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
        }

        // --- Gráfico de Líneas HH vs SEMANA ---
        // Generar matriz de datos (Proyectos x Semanas)
        int maxWeek = advances.stream().mapToInt(Advance::getNumberWeek).max().orElse(1);
        List<String> projectList = new ArrayList<>(projectMap.keySet());
        
        // Fila de cabecera para datos de gráfico (Semanas)
        int chartDataRowIdx = rowIdx + 2;
        Row chartHeaderRow = sheet.createRow(chartDataRowIdx++);
        chartHeaderRow.createCell(0).setCellValue("Proyecto / Semana");
        for (int i = 1; i <= maxWeek; i++) {
            chartHeaderRow.createCell(i).setCellValue("Sem " + i);
        }

        // Filas de datos
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

        // Crear el Gráfico
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

    private void createAnalyticsSheet(Workbook workbook, List<Advance> advances, Section section) {
        Sheet sheet = workbook.createSheet("Analítica y Responsabilidad");
        
        // --- 0. RESUMEN GENERAL DE LA SECCIÓN (GLOBAL KPIs) ---
        Row globalHeader = sheet.createRow(0);
        globalHeader.createCell(0).setCellValue("RESUMEN GENERAL DE LA SECCIÓN");
        globalHeader.getCell(0).setCellStyle(createHeaderStyle(workbook));
        
        // Calcular métricas globales
        Map<String, List<Advance>> studentMap = advances.stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getName() + " " + a.getStudent().getLastname()));
        
        int totalStudentsInDB = section.getStudents() != null ? section.getStudents().size() : studentMap.size();
        double avgReports = (double) advances.size() / Math.max(1, totalStudentsInDB);
        
        int currentAcademicWeek = 1;
        if (section.getStartDate() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(section.getStartDate(), java.time.LocalDate.now());
            currentAcademicWeek = (int) (days / 7) + 1;
        }

        int totalDelay = 0;
        int studentsWithBatch = 0;
        List<Double> fulfillments = new ArrayList<>();

        for (List<Advance> studentAds : studentMap.values()) {
            // Retraso
            int lastWeek = studentAds.stream().mapToInt(Advance::getNumberWeek).max().orElse(0);
            totalDelay += Math.max(0, currentAcademicWeek - 1 - lastWeek);

            // Batches
            boolean hasBatch = false;
            List<Advance> sortedByDate = studentAds.stream().sorted(Comparator.comparing(Advance::getSendDate)).collect(Collectors.toList());
            for (int i = 0; i < sortedByDate.size() - 1; i++) {
                if (sortedByDate.get(i).getSendDate().plusMinutes(10).isAfter(sortedByDate.get(i+1).getSendDate())) {
                    hasBatch = true; break;
                }
            }
            if (hasBatch) studentsWithBatch++;

            // Cumplimiento
            int totalPromises = 0; int keptPromises = 0;
            List<Advance> sortedByWeek = studentAds.stream().sorted(Comparator.comparing(Advance::getNumberWeek)).collect(Collectors.toList());
            for (int i = 0; i < sortedByWeek.size() - 1; i++) {
                Set<String> future = sortedByWeek.get(i).getFutureAdvances().stream().map(AdvanceFuture::getTypeAdvance).collect(Collectors.toSet());
                Set<String> done = sortedByWeek.get(i + 1).getDetails().stream().map(AdvanceDetail::getTypeAdvance).collect(Collectors.toSet());
                totalPromises += future.size();
                for (String p : future) if (done.contains(p)) keptPromises++;
            }
            if (totalPromises > 0) fulfillments.add((double) keptPromises / totalPromises);
        }

        double avgDelay = (double) totalDelay / Math.max(1, totalStudentsInDB);
        double avgFulfillment = fulfillments.stream().mapToDouble(d -> d).average().orElse(0.0);
        double pctBatch = (double) studentsWithBatch / Math.max(1, totalStudentsInDB);

        Row r1 = sheet.createRow(1); r1.createCell(0).setCellValue("Total Alumnos Inscritos:"); r1.createCell(1).setCellValue(totalStudentsInDB);
        Row r2 = sheet.createRow(2); r2.createCell(0).setCellValue("Promedio Reportes por Alumno:"); r2.createCell(1).setCellValue(avgReports);
        Row r3 = sheet.createRow(3); r3.createCell(0).setCellValue("Promedio Retraso (Semanas):"); r3.createCell(1).setCellValue(avgDelay);
        Row r4 = sheet.createRow(4); r4.createCell(0).setCellValue("Cumplimiento General Promedio:"); r4.createCell(1).setCellValue(avgFulfillment);
        CellStyle pctStyleGlobal = workbook.createCellStyle(); pctStyleGlobal.setDataFormat(workbook.createDataFormat().getFormat("0.0%"));
        r4.getCell(1).setCellStyle(pctStyleGlobal);
        Row r5 = sheet.createRow(5); r5.createCell(0).setCellValue("% Alumnos que reportan 'De Golpe':"); r5.createCell(1).setCellValue(pctBatch);
        r5.getCell(1).setCellStyle(pctStyleGlobal);

        // Espacio
        int rowIdx = 8;
        
        // --- 1. FRECUENCIA DE ENVÍO POR ALUMNO ---
        Row sectionTitle1 = sheet.createRow(rowIdx++);
        sectionTitle1.createCell(0).setCellValue("DETALLE DE FRECUENCIA POR ALUMNO");
        sectionTitle1.getCell(0).setCellStyle(createHeaderStyle(workbook));

        Row header1 = sheet.createRow(rowIdx++);
        header1.createCell(0).setCellValue("Alumno");
        header1.createCell(1).setCellValue("Total Reportes");
        header1.createCell(2).setCellValue("Semanas con Reporte");
        header1.createCell(3).setCellValue("Reportes Enviados 'De Golpe'");

        for (Map.Entry<String, List<Advance>> entry : studentMap.entrySet()) {
            List<Advance> studentAds = entry.getValue();
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(studentAds.size());
            
            String weeks = studentAds.stream()
                    .map(a -> a.getNumberWeek().toString())
                    .distinct()
                    .sorted()
                    .collect(Collectors.joining(", "));
            row.createCell(2).setCellValue(weeks);

            long batched = 0;
            if (studentAds.size() > 1) {
                List<Advance> sortedByDate = studentAds.stream().sorted(Comparator.comparing(Advance::getSendDate)).collect(Collectors.toList());
                for (int i = 0; i < sortedByDate.size() - 1; i++) {
                    if (sortedByDate.get(i).getSendDate().plusMinutes(10).isAfter(sortedByDate.get(i+1).getSendDate())) {
                        batched++;
                    }
                }
            }
            row.createCell(3).setCellValue(batched > 0 ? "SÍ (" + (batched + 1) + " seguidos)" : "No");
        }

        rowIdx += 2;
        // ... (resto de tablas de retraso y cumplimiento siguen abajo)
        rowIdx += 2;
        Row sectionTitle3 = sheet.createRow(rowIdx++);
        sectionTitle3.createCell(0).setCellValue("ALUMNOS CON TRABAJO PENDIENTE (RETRASOS)");
        sectionTitle3.getCell(0).setCellStyle(createHeaderStyle(workbook));

        Row header3 = sheet.createRow(rowIdx++);
        header3.createCell(0).setCellValue("Alumno / Proyecto");
        header3.createCell(1).setCellValue("Semana Actual Académica");
        header3.createCell(2).setCellValue("Última Semana Reportada");
        header3.createCell(3).setCellValue("Semanas de Retraso");

        for (Map.Entry<String, List<Advance>> entry : studentMap.entrySet()) {
            Row row = sheet.createRow(rowIdx++);
            List<Advance> studentAds = entry.getValue();
            int lastWeek = studentAds.stream().mapToInt(Advance::getNumberWeek).max().orElse(0);
            int delay = Math.max(0, currentAcademicWeek - 1 - lastWeek); // -1 porque la semana en curso aún no acaba

            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(currentAcademicWeek);
            row.createCell(2).setCellValue(lastWeek == 0 ? "Ninguna" : "Semana " + lastWeek);
            row.createCell(3).setCellValue(delay);
            
            if (delay > 1) {
                CellStyle delayStyle = workbook.createCellStyle();
                Font redFont = workbook.createFont();
                redFont.setColor(IndexedColors.RED.getIndex());
                redFont.setBold(true);
                delayStyle.setFont(redFont);
                row.getCell(3).setCellStyle(delayStyle);
            }
        }

        // --- 3. KPI: CUMPLIMIENTO DE COMPROMISOS ---
        rowIdx += 2;
        Row sectionTitle2 = sheet.createRow(rowIdx++);
        sectionTitle2.createCell(0).setCellValue("KPI: CUMPLIMIENTO (Siguiente Semana)");
        sectionTitle2.getCell(0).setCellStyle(createHeaderStyle(workbook));

        Row header2 = sheet.createRow(rowIdx++);
        header2.createCell(0).setCellValue("Alumno");
        header2.createCell(1).setCellValue("Compromisos");
        header2.createCell(2).setCellValue("Cumplidos");
        header2.createCell(3).setCellValue("% Cumplimiento");

        for (Map.Entry<String, List<Advance>> entry : studentMap.entrySet()) {
            List<Advance> studentAdvances = entry.getValue().stream()
                    .sorted(Comparator.comparing(Advance::getNumberWeek))
                    .collect(Collectors.toList());

            int totalPromises = 0;
            int keptPromises = 0;

            for (int i = 0; i < studentAdvances.size() - 1; i++) {
                Advance current = studentAdvances.get(i);
                Advance next = studentAdvances.get(i + 1);

                Set<String> futurePlanned = current.getFutureAdvances().stream()
                        .map(AdvanceFuture::getTypeAdvance)
                        .collect(Collectors.toSet());

                Set<String> nextDone = next.getDetails().stream()
                        .map(AdvanceDetail::getTypeAdvance)
                        .collect(Collectors.toSet());

                totalPromises += futurePlanned.size();
                for (String planned : futurePlanned) {
                    if (nextDone.contains(planned)) {
                        keptPromises++;
                    }
                }
            }

            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(totalPromises);
            row.createCell(2).setCellValue(keptPromises);
            if (totalPromises > 0) {
                double pct = (double) keptPromises / totalPromises;
                row.createCell(3).setCellValue(pct);
                CellStyle pctStyle = workbook.createCellStyle();
                pctStyle.setDataFormat(workbook.createDataFormat().getFormat("0.0%"));
                row.getCell(3).setCellStyle(pctStyle);
            } else {
                row.createCell(3).setCellValue("N/A");
            }
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
}
