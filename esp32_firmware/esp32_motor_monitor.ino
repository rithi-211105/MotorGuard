/*
 * esp32_motor_monitor.ino - ESP32 Microcontroller Telemetry Firmware
 * AI-Based Self-Powered Predictive Infrastructure Monitoring System
 *
 * Hardware Connections:
 * - Accelerometer: MPU6050 / ADXL345 via I2C (SDA -> GPIO 21, SCL -> GPIO 22)
 * - Temperature Sensor: DS18B20 / TMP117 via OneWire (Data -> GPIO 4)
 * - Battery Monitoring: ADC Voltage Divider (GPIO 34)
 * - Power: Piezoelectric / Thermal Energy Harvester + Battery Storage
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API Server Details
const char* serverUrl = "http://192.168.1.100:8000/api/telemetry/esp32"; // Replace with Server IP

// Sampling Constants
const int SAMPLE_WINDOW = 200; // 200 samples per window
const int SAMPLE_DELAY_MS = 5;  // ~200 Hz raw sampling

// Battery Voltage Calibration
const float ADC_REF_VOLTAGE = 3.3;
const float VOLTAGE_DIVIDER_RATIO = 2.0;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  Serial.println("=========================================");
  Serial.println(" ESP32 InfraMonitor Hardware Client");
  Serial.println("=========================================");

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP Address: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Sample Accelerometer & Calculate Vibration Metrics
    float sumSquare = 0.0;
    float peakAccel = 0.0;
    
    for (int i = 0; i < SAMPLE_WINDOW; i++) {
      // Read raw accelerometer acceleration (g)
      float accel_g = readRawAccelG();
      float abs_g = abs(accel_g);
      
      sumSquare += (accel_g * accel_g);
      if (abs_g > peakAccel) {
        peakAccel = abs_g;
      }
      delay(SAMPLE_DELAY_MS);
    }
    
    float accelRMS = sqrt(sumSquare / SAMPLE_WINDOW);
    float temperatureC = readTemperatureC();
    float batteryVoltage = readBatteryVoltage();
    float kurtosisVal = calculateKurtosis(accelRMS, peakAccel);

    // 2. Build JSON Payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = "ESP32-MOTOR-001";
    doc["accel_rms"] = accelRMS;
    doc["accel_peak"] = peakAccel;
    doc["temperature_c"] = temperatureC;
    doc["battery_v"] = batteryVoltage;
    doc["kurtosis"] = kurtosisVal;
    doc["skewness"] = 0.02;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // 3. Post Telemetry Payload to Backend API
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.printf("[ESP32 Telemetry Sent] RMS: %.4fg, Peak: %.4fg, Temp: %.1fC, Battery: %.2fV (HTTP %d)\n", 
                    accelRMS, peakAccel, temperatureC, batteryVoltage, httpResponseCode);
    } else {
      Serial.printf("[ESP32 Post Error] HTTP %d: %s\n", httpResponseCode, http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("Wi-Fi Disconnected. Reconnecting...");
    WiFi.reconnect();
  }
  
  delay(100); // Transmission cadence (~5-10 Hz)
}

// Mock sensor drivers (Replace with MPU6050 / DS18B20 library calls)
float readRawAccelG() {
  // Simulates raw accelerometer g-forces
  return (random(-100, 100) / 1000.0) + 0.02;
}

float readTemperatureC() {
  return 28.5 + (random(-5, 5) / 10.0);
}

float readBatteryVoltage() {
  int rawAdc = analogRead(34);
  return (rawAdc / 4095.0) * ADC_REF_VOLTAGE * VOLTAGE_DIVIDER_RATIO;
}

float calculateKurtosis(float rms, float peak) {
  return (peak / (rms + 0.0001)) * 1.2;
}
