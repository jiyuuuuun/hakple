package com.golden_dobakhe.HakPle;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import com.golden_dobakhe.HakPle.domain.resource.image.service.FileService;

@EnableJpaAuditing
@SpringBootApplication
public class HakPleApplication {


	public static void main(String[] args) {
		SpringApplication.run(HakPleApplication.class, args);
	}


}