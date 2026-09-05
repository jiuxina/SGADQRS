package com.scms.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 兼容多种日期时间入参格式：后端统一接收前端传来的
 * "yyyy-MM-dd HH:mm:ss"（空格分隔）与 ISO "yyyy-MM-ddTHH:mm[:ss]"。
 */
@Configuration
public class JacksonConfig {

    @Bean
    public SimpleModule flexLocalDateTimeModule() {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(LocalDateTime.class, new FlexLocalDateTimeDeserializer());
        return module;
    }

    public static class FlexLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime>
            implements ContextualDeserializer {

        private final DateTimeFormatter formatter;

        public FlexLocalDateTimeDeserializer() {
            this(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }

        public FlexLocalDateTimeDeserializer(DateTimeFormatter formatter) {
            this.formatter = formatter;
        }

        @Override
        public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            if (p.currentToken() != JsonToken.VALUE_STRING) {
                throw ctxt.weirdStringException(p.getText(), LocalDateTime.class, "期望日期时间字符串");
            }
            String v = p.getText().trim();
            if (v.isEmpty()) return null;
            // 空格分隔 → ISO 的 'T'
            if (v.length() > 10 && v.charAt(10) == ' ') {
                v = v.substring(0, 10) + 'T' + v.substring(11);
            }
            // yyyy-MM-ddTHH:mm → 补秒
            if (v.length() == 16) v = v + ":00";
            return LocalDateTime.parse(v, formatter);
        }

        @Override
        public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property)
                throws JsonMappingException {
            return this;
        }
    }
}
