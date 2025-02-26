# Nuclear Plant Simulator

A simulation game where you play as the engineer of a nuclear power plant. Monitor critical parameters, respond to emergencies, and ensure safe and efficient operation.

## How to Play

1. Open `index.html` in a web browser to start the simulation
2. Use the control panel to adjust:
   - Control rods: Regulates the nuclear reaction rate
   - Coolant flow: Manages reactor temperature
   - Turbine speed: Controls power generation

## Game Mechanics

### Key Parameters

- **Temperature**: Must be kept below 1000°C
- **Pressure**: Must be kept below 15 MPa
- **Radiation**: Must be kept below 50 mSv/h

### Safety Rating

The safety rating is calculated based on how close you are to critical thresholds for temperature, pressure, and radiation. A higher safety rating means safer operation.

### Power Output

Your goal is to maximize power output while maintaining safe operation. Adjusting control rods and turbine speed affects power generation.

### Emergency Procedures

If parameters reach dangerous levels:

1. Use the SCRAM button for emergency shutdown
2. Increase coolant flow to reduce temperature
3. Monitor the system status log for warnings and alerts

## Random Events

The simulation includes random events that will test your ability to respond to unexpected situations:

- Coolant pump fluctuations
- Control rod malfunctions
- Sensor glitches
- And more...

## Tips for Success

- Monitor gauges closely - they change color (green → yellow → red) as values approach danger levels
- Keep an eye on the system status log for important information
- Maintain a balance between power output and safety
- Don't make drastic changes to controls - small adjustments are usually better

## Technical Details

This simulator uses JavaScript for the reactor physics simulation, HTML for the interface structure, and CSS for styling. All simulation logic runs client-side in the browser.
