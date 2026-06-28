'use strict';

const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const connectDB = require('./src/config/db');

const projectKits = [
  {
    id: 'arduino_starter_basics_kit',
    name: 'Arduino Starter & Basics Kit',
    category: 'Project Kits',
    description: 'Perfect first kit for learning Arduino basics and digital electronics. Includes Uno R3 board, breadboard, sensor components, and LEDs. Ideal for school to diploma levels.',
    specifications: {
      'Target Group': 'School & College Students',
      'Controller Board': 'Arduino Uno R3 (CH340)',
      'Difficulty': 'Beginner',
      'Ages': '12+'
    },
    interfaces: ['GPIO', 'ADC', 'PWM', 'UART', 'I2C'],
    price: 1599,
    currency: 'INR',
    stock: 75,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Perfect first kit',
      'Ages 12+',
      'School to Diploma level',
      'No extra components needed',
      'Designed for school, college, and hackathon students'
    ],
    kitContents: [
      'Arduino Uno R3 (CH340) x1',
      'USB Type-A to Type-B cable x1',
      'Breadboard 830 point x1',
      'Jumper wires M-M 20cm (40 pcs)',
      'Jumper wires M-F 20cm (40 pcs)',
      'LEDs red, green, blue, yellow, white x10 each',
      'Resistor pack 220Ω, 1kΩ, 10kΩ (20 each)',
      'Capacitor 100nF ceramic x10',
      'Push-button tactile switch x5',
      'SPDT slide switch x2',
      'Active buzzer 5V x1',
      '9V battery holder x1',
      '16x2 LCD with I2C backpack x1',
      'DHT11 sensor x1',
      'HC-SR04 Ultrasonic sensor x1',
      'Relay module 1-channel x1',
      'Servo SG90 x1',
      'Potentiometer 10kΩ x2',
      'NPN transistor BC547 x5',
      'Diode 1N4007 x5'
    ],
    projectsIncluded: [
      'LED Blinking & Traffic Light (Control LED sequences, learn digital I/O)',
      'Push-button Counter (Count presses and show on LCD)',
      'Temperature Monitor (Read DHT11, display on LCD)',
      'Ultrasonic Distance Meter (Measure and display distance)',
      'Smart Light with Relay (Auto-switch light on ambient brightness)',
      'Servo Angle Controller (Control servo with potentiometer)',
      'Burglar Alarm (Ultrasonic + buzzer + relay)',
      'Password Door Lock (Button keypad + servo latch)',
      'Simple Weather Station (Temp, humidity, heat index on LCD)',
      'Plant Watering Alarm (DHT + buzzer for dry soil alert)'
    ]
  },
  {
    id: 'iot_wifi_smart_projects_kit',
    name: 'IoT & Wi-Fi Smart Projects Kit',
    category: 'Project Kits',
    description: 'Cloud connect smart kit centered around the ESP32 development board. Perfect for diploma or B.Tech semester projects. Build IoT weather stations, security monitors, and attendance systems.',
    specifications: {
      'Target Group': 'Diploma & B.Tech Students',
      'Controller Board': 'ESP32 WROOM-32 Dev Board',
      'Difficulty': 'Intermediate',
      'Ages': '15+'
    },
    interfaces: ['Wi-Fi', 'Bluetooth', 'I2C', 'GPIO', 'ADC'],
    price: 2499,
    currency: 'INR',
    stock: 50,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1562408590-e32931084e23?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Cloud connect',
      'Ages 15+',
      'Diploma / B.Tech semester projects',
      'Ideal for Internet of Things prototyping',
      'No extra components needed'
    ],
    kitContents: [
      'ESP32 WROOM-32 Dev Board x1',
      'USB Type-A to USB-C cable x1',
      'Breadboard 830 point x1',
      'Jumper wires M-M and M-F (40 pcs each)',
      'DHT22 Temp and Humidity sensor x1',
      'Soil Moisture Sensor module x1',
      'MQ-2 Gas Sensor x1',
      'PIR Motion Sensor x1',
      'Relay module 4-channel x1',
      '0.96 inch OLED I2C display x1',
      'LED assortment + 220Ω resistors x10',
      'Active buzzer x1',
      'Push-button switches x3',
      '18650 Li-Ion cell + holder x1',
      'TP4056 charging module USB-C x1',
      'Potentiometer 10kΩ x1'
    ],
    projectsIncluded: [
      'IoT Weather Station (Send temp/humidity to Blynk/ThingSpeak cloud)',
      'Smart Home Automation (Control 4 appliances via mobile app over Wi-Fi)',
      'Gas Leak Detector + Alert (MQ-2 triggers notification via ESP32)',
      'Smart Security System (PIR + OLED + relay + cloud push notification)',
      'Automatic Plant Irrigation (Soil moisture auto-triggers water pump relay)',
      'Air Quality Monitor Dashboard (MQ-135 + OLED + live web dashboard)',
      'Energy Monitor (ACS712 + ESP32 logs power usage to cloud)',
      'Wi-Fi Attendance System (RFID + ESP32 logs to Google Sheets)',
      'ESP32-CAM Smart Doorbell (Motion photo capture + Telegram notification)',
      'Smart Parking Counter (Ultrasonic sensors count slots on web UI)'
    ]
  },
  {
    id: 'robotics_motor_control_kit',
    name: 'Robotics & Motor Control Kit',
    category: 'Project Kits',
    description: 'Build and drive your own programmable robot chassis. Includes Arduino Uno R3, L298N driver, chassis base, motors, wheels, and obstacle avoidance sensors.',
    specifications: {
      'Target Group': 'Robotics Enthusiasts',
      'Controller Board': 'Arduino Uno R3',
      'Difficulty': 'Intermediate',
      'Ages': '14+'
    },
    interfaces: ['PWM', 'GPIO', 'ADC', 'I2C', 'Bluetooth'],
    price: 2199,
    currency: 'INR',
    stock: 60,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Build and drive',
      'Ages 14+',
      'School robotics / hackathons',
      'Includes 2WD acrylic chassis base',
      'Complete robotics parts package'
    ],
    kitContents: [
      'Arduino Uno R3 x1',
      'L298N Motor Driver Module x1',
      'BO Motor 150 RPM x2',
      'Robot Wheel 65mm x2',
      'Ball Caster Wheel 1 inch x1',
      '2WD Acrylic Chassis base x1',
      'Breadboard 400 point x1',
      'IR Obstacle Sensor module x2',
      'IR Line-follower sensor module x2',
      'HC-SR04 Ultrasonic Sensor x1',
      'Servo SG90 x1',
      'Bluetooth Module HC-06 x1',
      'Jumper wires M-M and M-F (30 pcs each)',
      '4xAA Battery Holder x1',
      'LED assortment + 220Ω x5',
      'Push-button x2'
    ],
    projectsIncluded: [
      'Obstacle-Avoidance Robot (Ultrasonic + servo scanner auto-navigates)',
      'Line-Follower Robot (IR sensors follow black tape on surface)',
      'Bluetooth-Controlled Car (Drive robot from phone via HC-06 app)',
      'Object-Sorting Robot (Colour sensor + servo arm sorts blocks)',
      'Maze-Solving Robot (IR + ultrasonic algorithm navigation)',
      'Wall-Following Robot (Maintain fixed distance from wall)',
      'Gesture-Controlled Robot (MPU-6050 glove controls direction)',
      'Voice-Controlled Robot (Bluetooth + voice commands from phone)'
    ]
  },
  {
    id: 'sensor_data_logging_kit',
    name: 'Sensor & Data Logging Kit',
    category: 'Project Kits',
    description: 'Measure and log data from the environment. Centered around Arduino Mega 2560. Ideal for final year university or research projects. Includes waterproof probe, load cell, and Real-Time Clock.',
    specifications: {
      'Target Group': 'Research & Final Year Students',
      'Controller Board': 'Arduino Mega 2560',
      'Difficulty': 'Advanced',
      'Ages': '16+'
    },
    interfaces: ['I2C', 'SPI', 'UART', 'GPIO', 'ADC', 'OneWire'],
    price: 2999,
    currency: 'INR',
    stock: 40,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Measure everything',
      'Ages 16+',
      'Final year / research projects',
      'Includes Arduino Mega 2560',
      'SD card logging ready'
    ],
    kitContents: [
      'Arduino Mega 2560 x1',
      'DHT22 Temp and Humidity x1',
      'BMP280 Pressure and Altitude x1',
      'DS18B20 Waterproof Temp Probe x1',
      'MQ-135 Air Quality Sensor x1',
      'Rain Sensor Module x1',
      'Current Sensor ACS712 20A x1',
      'Load Cell 5kg + HX711 module x1',
      'MPU-6050 Gyro + Accelerometer x1',
      'Pulse Oximeter MAX30102 x1',
      '0.96 inch OLED display x1',
      'MicroSD card module x1',
      'MicroSD card 8GB x1',
      'DS3231 Real-Time Clock module x1',
      'Jumper wires full set',
      'Breadboard 830 point x1',
      '9V power adapter x1'
    ],
    projectsIncluded: [
      'Multi-Parameter Weather Station (Logs temp, humidity, pressure, rain to SD)',
      'Smart Energy Meter (ACS712 measures current, logs consumption)',
      'Digital Smart Weighing Scale (Load cell + HX711 displays weight on OLED)',
      'Health Monitoring Band (MAX30102 SpO2 + heart rate logged with RTC)',
      'Earthquake Pre-Alert System (MPU-6050 detects vibration spikes with timestamp)',
      'Air Quality Data Logger (MQ-135 + BMP280 log air data every minute)',
      'Cold Chain Monitor (DS18B20 logs food/medicine storage temperature)',
      'Posture Correction Device (MPU-6050 alerts when back angle is wrong)'
    ]
  },
  {
    id: 'wireless_communication_gps_kit',
    name: 'Wireless Communication & GPS Kit',
    category: 'Project Kits',
    description: 'Connect, communicate, and locate. Explore GSM SMS notifications, GPS coordinates, RFID checks, and transceiver links. Features SIM800L, NEO-6M GPS, transceivers, and RFID modules.',
    specifications: {
      'Target Group': 'Advanced Hobbyists & Hackers',
      'Controller Board': 'ESP32 Dev Board',
      'Difficulty': 'Advanced',
      'Ages': '17+'
    },
    interfaces: ['Cellular', 'GPS', 'RF', 'SPI', 'I2C', 'UART'],
    price: 3499,
    currency: 'INR',
    stock: 35,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Connect and locate',
      'Ages 17+',
      'Advanced / Hackathon projects',
      'Includes GPS and Cellular modules',
      'Full RFID prototyping setup'
    ],
    kitContents: [
      'ESP32 Dev Board x1',
      'SIM800L GSM Module x1',
      'NEO-6M GPS Module x1',
      'HC-05 Bluetooth Module x1',
      'NRF24L01+PA+LNA RF Module x2',
      'RC522 RFID Module x1',
      'RFID cards + key fobs x5',
      '0.96 inch OLED display x1',
      'Active Buzzer x1',
      'Relay module 2-channel x1',
      'Breadboard 830 point x1',
      'Jumper wires full set 100 pcs',
      '18650 cell + holder x1',
      'TP4056 USB-C charging module x1',
      'SIM card (user-provided)'
    ],
    projectsIncluded: [
      'GPS Vehicle Tracker (NEO-6M + SIM800L sends location via SMS)',
      'RFID Smart Attendance (RC522 logs attendance to cloud via ESP32)',
      'Wireless Multi-Room Sensor Network (Two NRF24L01 nodes share sensor data)',
      'GSM Security Alarm (PIR + SIM800L calls/SMS on intrusion)',
      'Bluetooth Walkie-Talkie (Two HC-05 boards relay messages)',
      'Smart Access Control (RFID lock + Bluetooth monitor + cloud log)',
      'Pet and Luggage Tracker (GPS + GSM periodic SMS location tracker)',
      'Emergency SOS Device (Button + GPS + SIM800L sends coordinates)'
    ]
  },
  {
    id: 'display_user_interface_kit',
    name: 'Display & User Interface Kit',
    category: 'Project Kits',
    description: 'Show it off. Perfect for exhibition and hackathon demos. Includes TFT color screen, alphanumeric LCD, dot matrix, segment display, and addressable RGB LEDs.',
    specifications: {
      'Target Group': 'Creative Makers',
      'Controller Board': 'Arduino Uno R3',
      'Difficulty': 'Beginner',
      'Ages': '14+'
    },
    interfaces: ['SPI', 'I2C', 'GPIO', '1-Wire'],
    price: 1899,
    currency: 'INR',
    stock: 45,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Show it off',
      'Ages 14+',
      'Exhibition / hackathon demos',
      'Comprehensive displays variety',
      'Includes addressable RGB LED strip'
    ],
    kitContents: [
      'Arduino Uno R3 x1',
      '16x2 LCD I2C x1',
      '0.96 inch OLED I2C x1',
      '2.4 inch TFT SPI colour display x1',
      'TM1637 4-digit 7-segment module x1',
      '8x8 Dot Matrix LED MAX7219 x1',
      'WS2812B Addressable RGB LED strip 8 LEDs x1',
      'Potentiometer 10kΩ x2',
      'Push-button x4',
      'Passive buzzer x1',
      'DHT11 sensor x1',
      'Breadboard 830 point x1',
      'Jumper wires full set',
      'USB cable x1'
    ],
    projectsIncluded: [
      'Digital Alarm Clock (DS3231 + TM1637 displays time, buzzer alarm)',
      'Mini Weather Display (DHT11 + colour TFT shows data graphically)',
      'Scrolling LED Matrix Sign (Custom messages scroll on 8x8 matrix)',
      'RGB Mood Lamp (WS2812B cycles colours, pot controls speed)',
      'Simple Game Console (2-button game on OLED display)',
      'Animated Countdown Timer (Colour TFT countdown with progress bar)',
      'Music Visualiser (Sound sensor drives WS2812B intensity)',
      'Multi-sensor Dashboard (TFT shows live readings from sensors)'
    ]
  },
  {
    id: 'power_electronics_circuit_design_kit',
    name: 'Power Electronics & Circuit Design Kit',
    category: 'Project Kits',
    description: 'Understand power. Tailored for Electrical and EEE students. Build power supplies, motor controllers, audio amplifiers, charge controllers, and voltage regulators from scratch.',
    specifications: {
      'Target Group': 'Electrical & EEE Students',
      'Controller Board': 'Analog / IC Based',
      'Difficulty': 'Advanced',
      'Ages': '16+'
    },
    interfaces: ['Analog', 'GPIO'],
    price: 1499,
    currency: 'INR',
    stock: 55,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Understand power',
      'Ages 16+',
      'Electronics and EEE students',
      'Complete power regulators and ICs set',
      'Includes Digital Multimeter'
    ],
    kitContents: [
      'LM2596 Adjustable Buck Converter x1',
      'MT3608 Boost Converter Module x1',
      'L7805 Voltage Regulator TO-220 x2',
      'AMS1117 3.3V Regulator x3',
      '555 Timer IC NE555 x3',
      'LM358 Op-Amp x3',
      'LM324 Quad Op-Amp x2',
      'BC547 NPN Transistor x10',
      'TIP122 Darlington NPN x3',
      'IRFZ44N N-MOSFET x3',
      '1N4007 Rectifier Diode x10',
      '1N5819 Schottky Diode x5',
      'Zener Diodes 3.3V, 5V, 12V x3 each',
      'Resistor assortment 220Ω-100kΩ (200 pcs)',
      'Capacitor assortment 100nF-470uF (50 pcs)',
      'Vero Stripboard 10x15cm x2',
      'Digital Multimeter x1',
      'Breadboard 830 point x1',
      'Jumper wires full set'
    ],
    projectsIncluded: [
      'Variable Power Supply (LM2596 + voltmeter display, 1.25-35V adjustable)',
      'PWM Motor Speed Controller (555 timer PWM + MOSFET drives DC motor)',
      'Audio Amplifier Circuit (LM358 amplifies mic signal to 8Ω speaker)',
      'LED Dimmer Circuit (555 PWM + MOSFET dims LED strip smoothly)',
      'Transistor-based Switch (BC547/TIP122 switch relay from 3.3V logic)',
      'Voltage Regulator Board (L7805 + filter caps make clean 5V from 12V)',
      'Comparator Circuit (LM358 compares voltages, triggers relay/LED)',
      'Solar Charge Controller (MOSFET + Zener + op-amp basic MPPT circuit)'
    ]
  },
  {
    id: 'mini_drone_build_kit',
    name: 'Mini Drone Build Kit',
    category: 'Project Kits',
    description: 'Take flight. Assemble your own fully buildable F450 quadcopter drone. Features F3/F4 flight controller, brushless motors, transmitter, ESCs, LiPo battery and balanced charger.',
    specifications: {
      'Target Group': 'Aerospace & Final Year Students',
      'Controller Board': 'Flight Controller F3/F4 compatible',
      'Difficulty': 'Advanced',
      'Ages': '18+'
    },
    interfaces: ['RF', 'PWM', 'SBUS', 'PPM', 'I2C'],
    price: 6999,
    currency: 'INR',
    stock: 20,
    in_stock: true,
    images: ['https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500&auto=format&fit=crop&q=80'],
    features: [
      'Take flight',
      'Ages 18+',
      'Final year / aerospace projects',
      'Includes F450 Quadcopter frame kit',
      'Includes Flysky RC transmitter and receiver'
    ],
    kitContents: [
      'F450 Quadcopter Frame Kit 450mm x1',
      'Brushless Motor 2212 920KV x4',
      '30A BLHeli ESC x4',
      'Propeller 1045 CW+CCW pairs x2 sets',
      'Flysky FS-i6 6-CH Transmitter + FS-iA6 Receiver x1',
      'LiPo Battery 7.4V 2200mAh 2S 25C XT60 x1',
      'iMax B3 Pro LiPo Balance Charger x1',
      'Flight Controller F3/F4 compatible x1',
      'XT60 connector pair x2',
      'Power Distribution Board PDB x1',
      'Zip ties + standoffs hardware set',
      'LiPo battery voltage alarm buzzer x1'
    ],
    projectsIncluded: [
      'Build and Fly Quadcopter (Full F450 assembly — frame, motors, ESC, FC, remote)',
      'Altitude Hold Drone (Barometric sensor + FC firmware for stable hover)',
      'FPV Camera Drone (ESP32-CAM + video transmitter for first-person view)',
      'GPS Return-to-Home Drone (NEO-M8N GPS + ArduPilot autonomous return)',
      'Payload Drop Drone (Servo mechanism drops payload on command)'
    ]
  }
];

const seedKits = async () => {
  try {
    console.log('🌱  Starting Project Kits seeding process...');
    await connectDB();

    console.log('🧹  Cleaning existing Project Kits category products...');
    const deleteRes = await Product.deleteMany({ category: 'Project Kits' });
    console.log(`🧹  Deleted ${deleteRes.deletedCount} Project Kits.`);

    console.log(`📦  Preparing to insert ${projectKits.length} Project Kits...`);
    const inserted = await Product.insertMany(projectKits);
    console.log(`✅  Successfully seeded ${inserted.length} Project Kits into the MongoDB database!`);

    mongoose.connection.close();
    console.log('🔌  Database connection closed gracefully.');
    process.exit(0);
  } catch (error) {
    console.error('❌  Project Kits Seeding failed:', error);
    process.exit(1);
  }
};

seedKits();
