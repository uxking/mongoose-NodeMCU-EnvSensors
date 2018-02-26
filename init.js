load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_adc.js');
load('api_dht.js');
load('api_pwm.js');
load('api_esp8266.js');


let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = '/devices/' + Cfg.get('device.id') + '/events';
let envTopic = '/devices/' + Cfg.get('device.id') + '/envInfo';

let dhtPin = 12;
let success = ADC.enable(0);
print('Success--------------------:', success);

print('----------------------------LED GPIO:', led, 'button GPIO:', button);

// Initialize DHT library
let dht = DHT.create(dhtPin, DHT.DHT22);

let getEnvInfo = function() {
  return JSON.stringify({
    temp: dht.getTemp() * 9/5 + 32,
    humidity: dht.getHumidity(),
    lux: ADC.read(0)
  });
};

let getInfo = function() {
  return JSON.stringify({
    total_ram: Sys.total_ram(),
    free_ram: Sys.free_ram()
  });
};

// Built-in LED
GPIO.set_mode(led, GPIO.MODE_OUTPUT);


// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  let message = getInfo();
  let ok = MQTT.pub(topic, message, 1);
  print('Published:', ok, topic, '->', message);
  let envMessage = getEnvInfo();
  let envOk = MQTT.pub(envTopic, envMessage, 1);
  print('Published Env:', envOk, envTopic, '->', envMessage);
}, null);

//Timer.set(3000 /* 3 sec */, Timer.REPEAT, function() {
//  Timer.set(200, 0, function () {GPIO.write(led, 1)}, GPIO.write(led, 0));
//}, null);


Timer.set(5000 /* 5 sec */, Timer.REPEAT, function() {

  //print(Sys.uptime(), getInfo());
  let envMessage = getEnvInfo();
  let envOk = MQTT.pub(envTopic, envMessage, 1);
  print('Published Env:', envOk, envTopic, '->', envMessage);
  print('Environment readings: ', envMessage);
}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);

}, null);

// let envMessage = getEnvInfo();
// let envOk = MQTT.pub(envTopic, envMessage, 1);
// print('Published Env:', envOk, envTopic, '->', envMessage);
// print('Environment readings: ', envMessage);

//ESP8266.deepSleep(20e6);
