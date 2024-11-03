// Crear archivo de configuración (config.js)
export const CONFIG = {
  ESP32_IP: '192.168.1.XXX',  // Reemplaza XXX con la IP de tu ESP32
  ESP32_PORT: '81',           // Puerto del WebSocket en el ESP32
  UPDATE_INTERVAL: 2000,      // Intervalo de actualización en milisegundos
  MAX_HISTORICAL: 20,         // Número máximo de datos históricos a mantener
  WEBSOCKET_URL: function() {
    return `ws://${this.ESP32_IP}:${this.ESP32_PORT}`;
  }
};
  