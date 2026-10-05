require 'sinatra'
require 'json'
# require 'rmodbus' # Lo descomentaremos mañana cuando conectemos el LOGO! físico

# Configuración del servidor para que escuche en tu red local (el TP-Link)
set :bind, '0.0.0.0'
set :port, 4567
set :public_folder, File.dirname(__FILE__) + '/public'

# --- MODO SIMULACIÓN PARA PROBAR HOY ---
# Estas variables simulan el estado del PLC para que la GUI funcione sin crashear
$mock_q1 = false
$mock_sine_phase = 0.0
PLC_IP = '192.168.1.100' # La IP que le pondremos al LOGO! mañana

helpers do
  def read_plc_data
    # MAÑANA: Aquí irá la conexión Modbus real:
    # ModBus::TCPClient.new(PLC_IP, 502) do |cl|
    #   cl.with_slave(1) do |slave|
    #     q1_status = slave.read_coils(8192, 1).first 
    #   end
    # end
    
    # HOY: Generamos una onda sinusoidal matemática para simular la turbina
    $mock_sine_phase += 0.5
    sine_value = Math.sin($mock_sine_phase) * 100 
    
    {
      q1_status: $mock_q1,
      turbine_rpm: $mock_q1 ? (1500 + sine_value).round(2) : 0,
      voltage: 12.0 + (sine_value / 50.0).round(2),
      timestamp: Time.now.strftime("%H:%M:%S")
    }
  end

  def toggle_plc_q1
    # MAÑANA: Escribiremos la bobina de red (Network Coil) en el LOGO!
    $mock_q1 = !$mock_q1
    $mock_q1
  end
end

# Sirve la interfaz gráfica (HTML)
get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

# Endpoint (API) para que el Frontend lea los sensores
get '/api/status' do
  content_type :json
  read_plc_data.to_json
end

# Endpoint (API) para que el Frontend accione el botón
post '/api/toggle' do
  content_type :json
  new_status = toggle_plc_q1
  { success: true, q1_status: new_status }.to_json
end
