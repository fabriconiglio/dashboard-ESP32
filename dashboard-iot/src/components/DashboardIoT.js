import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Slider as MuiSlider,
  Switch as MuiSwitch,
  FormControlLabel
} from '@mui/material';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  RotateCw, 
  Lightbulb,
  Radio,
  Ruler
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardIoT = () => {
  const [sensores, setSensores] = useState({
    temperatura: 0,
    humedad: 0,
    gas: 0,
    infrarrojo: false,
    ultrasonido: 0
  });

  const [actuadores, setActuadores] = useState({
    motorPaso: 0,
    servomotor: 0,
    luces: false
  });

  const [historicos, setHistoricos] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [ws, setWs] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const enviarComando = (tipo, valor) => {
    if (!ws) return;
    
    const comando = {
      tipo: tipo,
      valor: valor
    };
    
    ws.send(JSON.stringify(comando));
  };

  const conectarWebSocket = () => {
    try {
      const wsConnection = new WebSocket(CONFIG.WEBSOCKET_URL());
      
      wsConnection.onopen = () => {
        setConectado(true);
        console.log(`Conectado al ESP32 en ${CONFIG.ESP32_IP}`);
      };
  
      wsConnection.onclose = () => {
        setConectado(false);
        console.log('Desconectado del ESP32');
      };
  
      wsConnection.onerror = (error) => {
        console.error('Error de WebSocket:', error);
        setConectado(false);
      };
  
      wsConnection.onmessage = (event) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        setDebounceTimer(setTimeout(() => {
          try {
            const datos = JSON.parse(event.data);
            
            // Actualizar datos actuales
            setSensores(datos);

            // Actualizar histórico con timestamp
            const datoConTimestamp = {
              ...datos,
              timestamp: new Date().toLocaleTimeString()
            };

            setHistoricos(prev => {
              // Si el array está vacío o el último dato es diferente, agregar nuevo dato
              if (prev.length === 0 || 
                  JSON.stringify(prev[prev.length - 1]) !== JSON.stringify(datoConTimestamp)) {
                return [...prev.slice(-CONFIG.MAX_HISTORICAL), datoConTimestamp];
              }
              return prev;
            });

          } catch (error) {
            console.error('Error al procesar datos:', error);
          }
        }, 100));
      };
  
      setWs(wsConnection);
    } catch (error) {
      console.error('Error al conectar:', error);
      setConectado(false);
    }
  };

  const toggleConexion = () => {
    if (conectado) {
      ws?.close();
    } else {
      conectarWebSocket();
    }
  };

  const controlarMotorPaso = (grados) => {
    setActuadores(prev => ({ ...prev, motorPaso: grados }));
    enviarComando('motorPaso', grados);
  };

  const controlarServomotor = (angulo) => {
    setActuadores(prev => ({ ...prev, servomotor: angulo }));
    enviarComando('servomotor', angulo);
  };

  const controlarLuces = () => {
    const nuevoEstado = !actuadores.luces;
    setActuadores(prev => ({ ...prev, luces: nuevoEstado }));
    enviarComando('luces', nuevoEstado);
  };

  // Efecto para limpieza del WebSocket
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  // Efecto para solicitar datos periódicamente
  useEffect(() => {
    let intervalo;
    
    if (conectado && ws) {
      intervalo = setInterval(() => {
        try {
          ws.send(JSON.stringify({ tipo: 'getDatos' }));
        } catch (error) {
          console.error('Error al solicitar datos:', error);
        }
      }, 2000);
    }

    return () => {
      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, [conectado, ws]);

  return (
    <Container>
      <Box sx={{ p: 4, bgcolor: 'grey.50', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Panel de Control IoT
          </Typography>
          <Button 
            onClick={toggleConexion}
            variant="contained"
            color={conectado ? "error" : "success"}
          >
            {conectado ? "Desconectar" : "Conectar"}
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Temperatura</Typography>
                  <Thermometer color="red" />
                </Box>
                <Typography variant="h4">
                  {sensores.temperatura.toFixed(1)}°C
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Humedad</Typography>
                  <Droplets color="#2196f3" />
                </Box>
                <Typography variant="h4">
                  {sensores.humedad.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Gas</Typography>
                  <Wind color="#757575" />
                </Box>
                <Typography variant="h4">
                  {sensores.gas} PPM
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Sensor Infrarrojo</Typography>
                  <Radio color={sensores.infrarrojo ? "#4caf50" : "#757575"} />
                </Box>
                <Typography variant="h4">
                  {sensores.infrarrojo ? "Detectado" : "No detectado"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Sensor Ultrasonido</Typography>
                  <Ruler color="#9c27b0" />
                </Box>
                <Typography variant="h4">
                  {sensores.ultrasonido} cm
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Motor Paso a Paso</Typography>
                  <RotateCw color="#2196f3" />
                </Box>
                <MuiSlider
                  value={actuadores.motorPaso}
                  onChange={(_, value) => controlarMotorPaso(value)}
                  max={360}
                  step={1}
                />
                <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                  {actuadores.motorPaso}°
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Servomotor</Typography>
                  <Gauge color="#ff9800" />
                </Box>
                <MuiSlider
                  value={actuadores.servomotor}
                  onChange={(_, value) => controlarServomotor(value)}
                  max={180}
                  step={1}
                />
                <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                  {actuadores.servomotor}°
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Luces</Typography>
                  <Lightbulb color={actuadores.luces ? "#ffc107" : "#757575"} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <MuiSwitch
                        checked={actuadores.luces}
                        onChange={controlarLuces}
                      />
                    }
                    label={actuadores.luces ? "Encendido" : "Apagado"}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Histórico de Sensores
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={historicos}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp"
                        interval="preserveEnd"
                        minTickGap={50}
                      />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="temperatura" 
                        stroke="#ef4444" 
                        name="Temperatura (°C)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="humedad" 
                        stroke="#3b82f6" 
                        name="Humedad (%)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gas" 
                        stroke="#6b7280" 
                        name="Gas (PPM)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ultrasonido" 
                        stroke="#9333ea" 
                        name="Distancia (cm)"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default DashboardIoT;