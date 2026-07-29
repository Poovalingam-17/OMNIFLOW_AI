package com.omniflow.controller;

import com.omniflow.dto.response.AgentPerformance;
import com.omniflow.dto.response.DailyStat;
import com.omniflow.dto.response.DashboardStats;
import com.omniflow.dto.response.UsageStats;
import com.omniflow.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }

    @GetMapping("/agents/performance")
    public ResponseEntity<List<AgentPerformance>> getAgentPerformance() {
        return ResponseEntity.ok(analyticsService.getAgentPerformance());
    }

    @GetMapping("/daily")
    public ResponseEntity<List<DailyStat>> getDailyStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getDailyStats(startDate, endDate));
    }

    @GetMapping("/usage")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsageStats> getUsageStats(@RequestParam(defaultValue = "all") String period) {
        return ResponseEntity.ok(analyticsService.getUsageStats(period));
    }
}
