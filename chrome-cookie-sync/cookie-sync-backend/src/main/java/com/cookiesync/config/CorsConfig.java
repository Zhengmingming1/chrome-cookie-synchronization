package com.cookiesync.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * CORS跨域配置
 * 
 * @author Cookie Sync Team
 * @version 1.0.0
 */
@Configuration
public class CorsConfig {

    @Value("${cookie-sync.security.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Value("${cookie-sync.security.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cookie-sync.security.cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${cookie-sync.security.cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 设置允许的源
        if ("*".equals(allowedOrigins)) {
            configuration.addAllowedOriginPattern("*");
        } else {
            configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        }
        
        // 设置允许的HTTP方法
        configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        
        // 设置允许的请求头
        if ("*".equals(allowedHeaders)) {
            configuration.addAllowedHeader("*");
        } else {
            configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        }
        
        // 设置是否允许携带凭证
        configuration.setAllowCredentials(allowCredentials);
        
        // 设置预检请求的缓存时间
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}