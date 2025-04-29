package com.golden_dobakhe.HakPle.global;

import com.fasterxml.jackson.annotation.JsonCreator;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Arrays;

@Schema(description = "상태")
public enum Status {
    ACTIVE("active"),
    INACTIVE("inactive"),
    PENDING("pending");

    private final String value;

    Status(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Status fromValue(String value) {
        return Arrays.stream(Status.values())
                .filter(status -> status.getValue().equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid status value: " + value));
    }
}