package com.omniflow.dto.response;

import java.time.LocalDate;

public interface DailyStat {
    LocalDate getDate();
    Long getQueries();
    Double getSuccessRate();
}
