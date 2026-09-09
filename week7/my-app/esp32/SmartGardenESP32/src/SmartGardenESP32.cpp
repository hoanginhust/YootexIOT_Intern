#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================
// 1. NETWORK & MQTT BROKER CONFIGURATION
// ==========================================
const char* WIFI_SSID     = "Hoang Hiep-2.4G-ext";     // Replace with your 2.4GHz Wi-Fi SSID
const char* WIFI_PASS     = "07042005";                // Replace with your Wi-Fi Password
const char* MQTT_HOST     = "broker.hivemq.com";       // HiveMQ Public Broker matching backend .env
const uint16_t MQTT_PORT  = 1883;
const char* MQTT_USER     = "";                        // Keep empty for public broker
const char* MQTT_PASS     = "";

// Target Garden ID: Must match a registered garden in PostgreSQL
const int GARDEN_ID       = 1;

// MQTT Topics matching NestJS TelemetryModule
const char* TOPIC_SENSOR  = "esp32/sensor_data";
const char* TOPIC_COMMAND = "esp32/commands";

// ==========================================
// 2. HARDWARE GPIO PIN DEFINITIONS
// ==========================================
// Safe pins on ESP32-S3 DevKitC-1 left header
const uint8_t PIN_LED_RED    = 18;  // Red LED    -> GPIO 18
const uint8_t PIN_LED_YELLOW = 17;  // Yellow LED -> GPIO 17
const uint8_t PIN_LED_GREEN  = 16;  // Green LED  -> GPIO 16

// Optional: Uncomment line below if physical DHT11 sensor is connected
// #define USE_DHT11
#ifdef USE_DHT11
#include <DHT.h>
#define DHT_PIN  15
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);
#endif

// ==========================================
// 3. OPERATIONAL CONSTANTS & STATE VARIABLES
// ==========================================
const unsigned long SENSOR_INTERVAL_MS = 1000; // Publish interval: 1 seconds
const float TEMP_MAX     = 38.0;               // High temperature alert threshold
const float TEMP_WARN    = 32.0;               // Warning threshold
const float HUMIDITY_MIN = 30.0;               // Low humidity alert threshold

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

unsigned long lastPublishMs = 0;
uint32_t packetNo = 1;

// LED states (true = HIGH / active)
bool ledRed       = false;
bool ledYellow    = false;
bool ledGreen     = false;
bool manualMode   = false; // Locks automatic mode when manual command is received

// Simulated walk values (used when DHT11 is disabled)
float simTemp = 28.0;
float simHum  = 60.0;

// Function prototypes
void connectWiFi();
void connectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishSensorData();
void applyLeds();
void setAutoStatusLeds(float temp, float humidity);
void blinkAll(uint8_t times, uint16_t delayMs);

// ==========================================
// 4. SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(200);

  // Initialize LED pins as output and set default to LOW
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  applyLeds();

#ifdef USE_DHT11
  dht.begin();
#endif

  // Circuit self-test: Flash RED -> YELLOW -> GREEN -> ALL
  blinkAll(1, 200);
  digitalWrite(PIN_LED_RED, HIGH);    delay(200); digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_YELLOW, HIGH); delay(200); digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_GREEN, HIGH);  delay(200); digitalWrite(PIN_LED_GREEN, LOW);
  blinkAll(2, 100);

  connectWiFi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
  connectMQTT();
}

// ==========================================
// 5. MAIN LOOP
// ==========================================
void loop() {
  // Ensure network and broker connections remain alive
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  if (!mqtt.connected()) {
    connectMQTT();
  }
  mqtt.loop();

  // Periodic telemetry transmission
  unsigned long now = millis();
  if (now - lastPublishMs >= SENSOR_INTERVAL_MS) {
    lastPublishMs = now;
    publishSensorData();
  }
}

// ==========================================
// 6. WI-FI CONNECTION HANDLER
// ==========================================
void connectWiFi() {
  Serial.print("[WIFI] Connecting to SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  uint8_t attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.print("[WIFI] Local IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Connection failed. Please check SSID/Password.");
  }
}

// ==========================================
// 7. MQTT RECONNECTION HANDLER
// ==========================================
void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("[MQTT] Connecting to broker...");

    // Generate unique client ID to prevent broker disconnection collisions
    String clientId = "SmartGarden_ESP32_" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" CONNECTED!");
      mqtt.subscribe(TOPIC_COMMAND);
      Serial.print("[MQTT] Subscribed to topic: ");
      Serial.println(TOPIC_COMMAND);
    } else {
      Serial.printf(" Failed, rc=%d. Retrying in 3 seconds...\n", mqtt.state());
      delay(3000);
    }
  }
}

// ==========================================
// 8. MQTT INCOMING COMMAND CALLBACK
// ==========================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("\n[CMD] Inbound packet on topic: %s\n", topic);

  // Allocate 512 bytes to accommodate NestJS microservice wrapper
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.printf("[CMD] JSON parse error: %s\n", err.c_str());
    return;
  }

  // Handle both raw JSON and NestJS microservice payload wrapper
  JsonObject root = doc.containsKey("data") ? doc["data"].as<JsonObject>() : doc.as<JsonObject>();

  // Validate target garden ID
  if (root.containsKey("gardenId")) {
    int cmdGardenId = root["gardenId"].as<int>();
    if (cmdGardenId != GARDEN_ID) {
      Serial.printf("[CMD] Packet ignored: Target garden is %d (Device assigned to %d)\n", cmdGardenId, GARDEN_ID);
      return;
    }
  }

  // 1. Check for explicit mode switch command
  if (root.containsKey("mode")) {
    if (strcmp(root["mode"], "Auto") == 0) {
      manualMode = false;
      Serial.println("[CMD] Mode switched to AUTO. Restoring sensor-based thresholds.");
      // Instantly restore LEDs according to current environment status
      setAutoStatusLeds(simTemp, simHum);
      return;
    } else if (strcmp(root["mode"], "Manual") == 0) {
      manualMode = true;
    }
  }

  bool stateChanged = false;

  // 2. Process 3-LED independent commands
  if (root.containsKey("ledRedState")) {
    ledRed = (strcmp(root["ledRedState"], "On") == 0);
    stateChanged = true;
  }
  if (root.containsKey("ledYellowState")) {
    ledYellow = (strcmp(root["ledYellowState"], "On") == 0);
    stateChanged = true;
  }
  if (root.containsKey("ledGreenState")) {
    ledGreen = (strcmp(root["ledGreenState"], "On") == 0);
    stateChanged = true;
  }

  // 3. Backward compatibility: led1State (maps to Green LED)
  if (root.containsKey("led1State")) {
    ledGreen = (strcmp(root["led1State"], "On") == 0);
    stateChanged = true;
  }

  if (stateChanged) {
    manualMode = true; // Lock in manual mode upon manual actuation
    applyLeds();
    Serial.printf("[CMD] Output updated -> RED: %s | YELLOW: %s | GREEN: %s (Manual Mode)\n",
                  ledRed ? "ON" : "OFF",
                  ledYellow ? "ON" : "OFF",
                  ledGreen ? "ON" : "OFF");
  }
}

// ==========================================
// 9. TELEMETRY PUBLISHER
// ==========================================
void publishSensorData() {
  float temperature, humidity;

#ifdef USE_DHT11
  temperature = dht.readTemperature();
  humidity    = dht.readHumidity();
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[SENSOR] DHT reading failed. Falling back to simulation.");
    temperature = simTemp;
    humidity    = simHum;
  }
#else
  // Random walk simulation for steady, realistic metric shifts
  simTemp += random(-15, 16) / 10.0f;
  simHum  += random(-15, 16) / 10.0f;
  simTemp = constrain(simTemp, 20.0f, 42.0f);
  simHum  = constrain(simHum, 25.0f, 90.0f);

  temperature = simTemp;
  humidity    = simHum;
#endif

// Format payload matching SensorDataDto schema
  StaticJsonDocument<256> doc;
  doc["gardenId"]  = GARDEN_ID;
  doc["id"]        = GARDEN_ID;
  doc["packet_no"] = packetNo++;

  // Keep persistent buffers for serialized() to prevent dangling pointer 0.0 values
  char strTemp[8], strHum[8];
  dtostrf(temperature, 1, 1, strTemp);
  dtostrf(humidity, 1, 1, strHum);

  doc["temperature"] = serialized(strTemp);
  doc["humidity"]    = serialized(strHum);

  char buffer[256];
  serializeJson(doc, buffer);

if (mqtt.publish(TOPIC_SENSOR, buffer)) {
    Serial.printf("[SENSOR] Published -> Temp: %.1f °C | Hum: %.1f%% | Packet #%u\n",
                  temperature, humidity, packetNo - 1);
  } else {
    Serial.println("[SENSOR] Telemetry publish failed!");
  }

  // If in automatic mode, reflect environmental status via LEDs
  if (!manualMode) {
    setAutoStatusLeds(temperature, humidity);
  }
}

// ==========================================
// 10. LED ACTUATION & AUTO MODE LOGIC
// ==========================================
void setAutoStatusLeds(float temp, float humidity) {
  if (temp > TEMP_MAX || humidity < HUMIDITY_MIN) {
    // Critical danger: Temperature > 38°C or Humidity < 30% -> Red LED
    ledRed = true;  ledYellow = false; ledGreen = false;
  } else if (temp > TEMP_WARN) {
    // Warning state: Temperature 32 - 38°C -> Yellow LED
    ledRed = false; ledYellow = true;  ledGreen = false;
  } else {
    // Safe operational state -> Green LED
    ledRed = false; ledYellow = false; ledGreen = true;
  }
  applyLeds();
}

void applyLeds() {
  digitalWrite(PIN_LED_RED,    ledRed    ? HIGH : LOW);
  digitalWrite(PIN_LED_YELLOW, ledYellow ? HIGH : LOW);
  digitalWrite(PIN_LED_GREEN,  ledGreen  ? HIGH : LOW);
}

void blinkAll(uint8_t times, uint16_t delayMs) {
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_GREEN, HIGH);
    delay(delayMs);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
    delay(delayMs);
  }
}