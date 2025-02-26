class Reactor {
    constructor() {
        // Core reactor parameters
        this.temperature = 20; // degrees Celsius
        this.pressure = 0.1; // MPa
        this.radiation = 0.1; // mSv/h
        this.controlRodsLevel = 50; // percentage
        this.coolantFlowRate = 50; // percentage
        this.turbineSpeed = 50; // percentage
        
        // Operational limits
        this.maxTemperature = 1000; // degrees Celsius
        this.maxPressure = 15; // MPa
        this.maxRadiation = 50; // mSv/h
        
        // Reactor state
        this.power = 0; // MW
        this.running = false;
        this.scramInitiated = false;
        this.faultConditions = [];
        
        // Simulation variables
        this.tick = 0;
    }
    
    start() {
        this.running = true;
        return "Reactor startup sequence initiated.";
    }
    
    scram() {
        this.scramInitiated = true;
        this.controlRodsLevel = 100; // fully insert control rods
        this.coolantFlowRate = 100; // maximum coolant
        return "SCRAM initiated! Emergency shutdown in progress.";
    }
    
    update() {
        if (!this.running) return;
        
        this.tick++;
        
        // Calculate reactor physics
        this.calculateTemperature();
        this.calculatePressure();
        this.calculateRadiation();
        this.calculatePower();
        
        // Check for fault conditions
        this.checkFaults();
        
        // Handle SCRAM if initiated
        if (this.scramInitiated) {
            this.handleScram();
        }
        
        // Return current status
        return {
            temperature: this.temperature,
            pressure: this.pressure,
            radiation: this.radiation,
            power: this.power,
            faults: this.faultConditions
        };
    }
    
    calculateTemperature() {
        // Base temperature calculation
        const controlRodEffect = (100 - this.controlRodsLevel) * 10;
        const coolantEffect = this.coolantFlowRate * 5;
        
        // Temperature increases with less control rods and decreases with more coolant
        const temperatureChange = (controlRodEffect - coolantEffect) * 0.05;
        
        // Random fluctuations
        const randomFactor = (Math.random() - 0.5) * 5;
        
        this.temperature += temperatureChange + randomFactor;
        
        // Ensure temperature stays within physical limits
        this.temperature = Math.max(20, Math.min(this.temperature, this.maxTemperature * 1.5));
    }
    
    calculatePressure() {
        // Pressure increases with temperature and decreases with coolant flow
        const temperatureEffect = this.temperature * 0.01;
        const coolantEffect = this.coolantFlowRate * 0.05;
        
        this.pressure = (temperatureEffect - coolantEffect) * 0.1;
        this.pressure = Math.max(0.1, Math.min(this.pressure, this.maxPressure * 1.5));
    }
    
    calculateRadiation() {
        // Radiation increases with power and temperature
        const powerEffect = this.power * 0.05;
        const temperatureEffect = this.temperature > 600 ? (this.temperature - 600) * 0.1 : 0;
        
        this.radiation = 0.1 + powerEffect + temperatureEffect;
        this.radiation = Math.max(0.1, Math.min(this.radiation, this.maxRadiation * 3));
    }
    
    calculatePower() {
        // Power generation based on control rods and turbine speed
        const reactorOutput = (100 - this.controlRodsLevel) * 10;
        this.power = (reactorOutput * (this.turbineSpeed / 100)) * 0.1;
        
        // Reduce power if temperature is too high
        if (this.temperature > this.maxTemperature * 0.8) {
            const reductionFactor = 1 - ((this.temperature - (this.maxTemperature * 0.8)) / (this.maxTemperature * 0.2));
            this.power *= Math.max(0.1, reductionFactor);
        }
    }
    
    checkFaults() {
        this.faultConditions = [];
        
        // Check for temperature issues
        if (this.temperature > this.maxTemperature * 0.8) {
            this.faultConditions.push({
                type: 'warning',
                system: 'temperature',
                message: 'High temperature warning',
                value: this.temperature
            });
        }
        
        if (this.temperature > this.maxTemperature) {
            this.faultConditions.push({
                type: 'critical',
                system: 'temperature',
                message: 'CRITICAL: Temperature exceeds maximum safe level',
                value: this.temperature
            });
        }
        
        // Check for pressure issues
        if (this.pressure > this.maxPressure * 0.8) {
            this.faultConditions.push({
                type: 'warning',
                system: 'pressure',
                message: 'High pressure warning',
                value: this.pressure
            });
        }
        
        if (this.pressure > this.maxPressure) {
            this.faultConditions.push({
                type: 'critical',
                system: 'pressure',
                message: 'CRITICAL: Pressure exceeds maximum safe level',
                value: this.pressure
            });
        }
        
        // Check for radiation issues
        if (this.radiation > this.maxRadiation * 0.8) {
            this.faultConditions.push({
                type: 'warning',
                system: 'radiation',
                message: 'High radiation warning',
                value: this.radiation
            });
        }
        
        if (this.radiation > this.maxRadiation) {
            this.faultConditions.push({
                type: 'critical',
                system: 'radiation',
                message: 'CRITICAL: Radiation exceeds maximum safe level',
                value: this.radiation
            });
        }
    }
    
    handleScram() {
        // Gradually reduce temperature and pressure
        this.temperature = Math.max(20, this.temperature * 0.99);
        this.pressure = Math.max(0.1, this.pressure * 0.98);
        this.radiation = Math.max(0.1, this.radiation * 0.97);
        
        // Check if SCRAM process is complete
        if (this.temperature <= 50 && this.pressure <= 0.5 && this.radiation <= 0.5) {
            this.running = false;
            this.scramInitiated = false;
            return true; // SCRAM complete
        }
        return false;
    }
    
    // Control methods
    setControlRods(level) {
        if (!this.scramInitiated) {
            this.controlRodsLevel = Math.max(0, Math.min(100, level));
        }
    }
    
    setCoolantFlow(level) {
        if (!this.scramInitiated) {
            this.coolantFlowRate = Math.max(0, Math.min(100, level));
        }
    }
    
    setTurbineSpeed(level) {
        this.turbineSpeed = Math.max(0, Math.min(100, level));
    }
    
    reset() {
        this.temperature = 20;
        this.pressure = 0.1;
        this.radiation = 0.1;
        this.controlRodsLevel = 50;
        this.coolantFlowRate = 50;
        this.turbineSpeed = 50;
        this.power = 0;
        this.running = false;
        this.scramInitiated = false;
        this.faultConditions = [];
        this.tick = 0;
        return "Simulation reset. Reactor in standby mode.";
    }
}
