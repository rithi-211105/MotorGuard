/*
 * esp32_dc_motor_monitor.ino - ESP32 12 V DC Motor Telemetry Firmware
 * MotorGuard AI - Physical 12 V DC Motor (MOTOR-12V-001) Integration
 *
 * SENSOR & HARDWARE PIN ASSIGNMENTS:
 * -------------------------------------------------------------------------
 * - Current Sensor (ACS712 / Analog):    GPIO 34 (ADC1_CH6, 0-3.3V)
 *   OR INA219 I2C Sensor:                SDA -> GPIO 21, SCL -> GPIO 22
 * - Vibration Sensor (ADXL345 / MPU6050): SDA -> GPIO 21, SCL -> GPIO 22
 * - Voltage Divider (12V Motor Bus):    [REQUIRES HARDWARE CONFIGURATION: e.g. GPIO 35]
 * - Optical Tachometer (RPM Sensor):    [REQUIRES HARDWARE CONFIGURATION: e.g. GPIO 18 (Interrupt)]
 * - PWM Motor Speed Control (to Driver): [REQUIRES HARDWARE CONFIGURATION: e.g. GPIO 25 (LEDC PWM)]
 * - Common Ground (GND):                 ESP32 GND MUST BE TIED TO 12V MOTOR GND!
 *
 * TARGET BACKEND ENDPOINT:
 * POST http://<SERVER_IP>:8000/api/telemetry/esp32/dc
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API Server URL (Replace with your computer's local IP address)
const char* serverUrl = "http://192.168.1.100:8000/api/telemetry/esp32/dc";

// Current Sensor Calibration (e.g. ACS712-05B: 185 mV/A, zero at VCC/2 = ~1.65V on 3.3V ADC)
const int CURRENT_PIN = 34; // GPIO 34 (ADC1)
const float ADC_VREF = 3.3;
const float SENSOR_ZERO_OFFSET_V = 1.65; // Measured zero-current voltage
const float SENSOR_SENSITIVITY_V_PER_A = 0.185; // 185 mV/A for 5A version

// Window Sampling Configuration
const int SAMPLE_COUNT = 64; // 64 raw waveform samples per telemetry packet
const int SAMPLE_INTERVAL_MICROS = 1000; // 1 kHz sampling rate (1000 microseconds)

// Telemetry state
float currentSamples[SAMPLE_COUNT];

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=========================================");
  Serial.println(" MotorGuard AI - 12 V DC Motor Telemetry");
  Serial.println(" Asset ID: MOTOR-12V-001 | Profile: dc_motor_12v");
  Serial.println("=========================================");

  // ADC attenuation configuration for 0-3.3V range
  analogSetPinAttenuation(CURRENT_PIN, ADC_11db);

  // Initialize Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[OK] WiFi Connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. High-Frequency Sampling of Motor Current Waveform
    float sumCurrent = 0.0;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
      int rawAdc = analogRead(CURRENT_PIN);
      float pinVoltage = (rawAdc / 4095.0) * ADC_VREF;
      float sampledAmps = (pinVoltage - SENSOR_ZERO_OFFSET_V) / SENSOR_SENSITIVITY_V_PER_A;
      
      // Clamp near-zero idle noise
      if (abs(sampledAmps) < 0.02) sampledAmps = 0.0;
      
      currentSamples[i] = sampledAmps;
      sumCurrent += sampledAmps;
      delayMicroseconds(SAMPLE_INTERVAL_MICROS);
    }
    float meanCurrent = sumCurrent / SAMPLE_COUNT;

    // 2. Build JSON Telemetry Payload matching Step 10 contract
    StaticJsonDocument<2048> doc;
    doc["device_id"] = "ESP32-DC-001";
    doc["voltage_v"] = 12.00; // Replace with voltage divider analogRead when calibrated
    doc["current_a"] = round(meanCurrent * 1000.0) / 1000.0;
    doc["speed_rpm"] = 1150.0; // Replace with optical tachometer pulse count
    doc["pwm"] = 150.0;       // Current PWM command
    doc["vibration_rms"] = 0.012; // Accelerometer RMS vibration

    JsonArray samplesArray = doc.createNestedArray("current_samples");
    for (int i = 0; i < SAMPLE_COUNT; i++) {
      samplesArray.add(round(currentSamples[i] * 1000.0) / 1000.0);
    }

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // 3. Transmit to MotorGuard Backend
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonPayload);
    if (httpCode == 200) {
      String response = http.getString();
      Serial.printf("[HTTP 200 OK] Mean Current: %.3f A | Samples: %d\n", meanCurrent, SAMPLE_COUNT);
    } else {
      Serial.printf("[HTTP ERROR %d]: %s\n", httpCode, http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[WARN] WiFi Disconnected, reconnecting...");
    WiFi.reconnect();
  }

  delay(200); // 5 Hz update rate
}
