package com.golden_dobakhe.HakPle.global;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.swagger.v3.oas.annotations.media.Schema;


@Schema(description = "상태")
public enum Status {
    ACTIVE("active"),
    INACTIVE("inactive"),
    PENDING("pending");

    private final String value;

    Status(String value) {
        this.value = value;
    }

    @JsonValue //enum → 문자열 응답
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Status fromValue(String value) {
        for (Status status : values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid status value: " + value);
    }
}