package com.omniflow.repository;

import com.omniflow.model.Analytics;
import com.omniflow.dto.response.AgentPerformance;
import com.omniflow.dto.response.DailyStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    
    @Query("SELECT a.agent.name as name, " +
           "CAST(SUM(a.successfulQueries) * 100.0 / NULLIF(SUM(a.totalQueries), 0) AS double) as successRate, " +
           "AVG(a.avgResponseTimeMs) as avgResponseTime " +
           "FROM Analytics a GROUP BY a.agent.name")
    List<AgentPerformance> getAgentPerformance();
    
    @Query("SELECT a.date as date, " +
           "SUM(a.totalQueries) as queries, " +
           "CAST(SUM(a.successfulQueries) * 100.0 / NULLIF(SUM(a.totalQueries), 0) AS double) as successRate " +
           "FROM Analytics a WHERE a.date BETWEEN :startDate AND :endDate GROUP BY a.date ORDER BY a.date ASC")
    List<DailyStat> getDailyStats(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(a.totalTokens), 0) FROM Analytics a")
    long getTotalTokens();

    @Query("SELECT COALESCE(SUM(a.estimatedCost), 0) FROM Analytics a")
    BigDecimal getTotalCost();

    @Query("SELECT a.agent.name, SUM(a.totalQueries) FROM Analytics a GROUP BY a.agent.name")
    List<Object[]> getQueriesByAgentRaw();
}
