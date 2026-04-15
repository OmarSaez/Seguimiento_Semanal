package com.seguimiento.semanal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableMethodSecurity
public class SemanalApplication {

	public static void main(String[] args) {
		SpringApplication.run(SemanalApplication.class, args);
	}

}
