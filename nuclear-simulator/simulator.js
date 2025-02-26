document.addEventListener('DOMContentLoaded', () => {
    // Initialize the reactor
    const reactor = new Reactor();
    
    // Get UI elements
    const tempGauge = document.getElementById('temp-value');
    const pressureGauge = document.getElementById('pressure-value');
    const radiationGauge = document.getElementById('radiation-value');
    
    const temperatureDisplay = document.getElementById('temperature');
    const pressureDisplay = document.getElementById('pressure');
    const radiationDisplay = document.getElementById('radiation');
    
    const powerOutput = document.getElementById('power-output');
    const safetyRating = document.getElementById('safety-rating');
    const timeDisplay = document.getElementById('time');
    
    const controlRodsSlider = document.getElementById('control-rods');
    const coolantFlowSlider = document.getElementById('coolant-flow');
    const turbineSpeedSlider = document.getElementById('turbine-speed');
    
    const controlRodsValue = document.getElementById('control-rods-value');
    const coolantFlowValue = document.getElementById('coolant-flow-value');
    const turbineSpeedValue = document.getElementById('turbine-speed-value');
    
    const statusLog = document.getElementById('status-log');
    const scramButton = document.getElementById('scram-button');
    const resetButton = document.getElementById('reset-button');
    
    const alertModal = document.getElementById('alert-modal');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertOk = document.getElementById('alert-ok');
    
    // Timer variables
    let simulationTime = 0;
    let simulationInterval = null;
    let simulatorActive = false;
    
    // Setup event listeners for simulator container visibility
    const simulatorContainer = document.getElementById('simulator-container');
    const environmentContainer = document.getElementById('environment-container');
    
    // Setup observer to watch when simulator becomes visible
    const simulatorObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style' && 
                simulatorContainer.style.display !== 'none' && 
                !simulatorActive) {
                initializeSimulator();
            }
        });
    });
    
    // Start observing simulator container for display changes
    simulatorObserver.observe(simulatorContainer, { attributes: true });
    
    // Setup exit button handler
    document.getElementById('exit-simulator').addEventListener('click', () => {
        simulatorContainer.style.display = 'none';
        environmentContainer.style.display = 'block';
    });
    
    // Only initialize when simulator is opened
    function initializeSimulator() {
        if (simulatorActive) return;
        simulatorActive = true;
        
        // Control event listeners
        controlRodsSlider.addEventListener('input', () => {
            const value = controlRodsSlider.value;
            controlRodsValue.textContent = `${value}%`;
            reactor.setControlRods(parseInt(value, 10));
            logEvent(`Control rods adjusted to ${value}%`);
        });
        
        coolantFlowSlider.addEventListener('input', () => {
            const value = coolantFlowSlider.value;
            coolantFlowValue.textContent = `${value}%`;
            reactor.setCoolantFlow(parseInt(value, 10));
            logEvent(`Coolant flow adjusted to ${value}%`);
        });
        
        turbineSpeedSlider.addEventListener('input', () => {
            const value = turbineSpeedSlider.value;
            turbineSpeedValue.textContent = `${value}%`;
            reactor.setTurbineSpeed(parseInt(value, 10));
            logEvent(`Turbine speed adjusted to ${value}%`);
        });
        
        scramButton.addEventListener('click', () => {
            const message = reactor.scram();
            logEvent(message, 'critical');
            showAlert('EMERGENCY SCRAM', 'Emergency shutdown initiated. Control rods fully inserted. Coolant flow maximized.');
        });
        
        resetButton.addEventListener('click', () => {
            stopSimulation();
            const message = reactor.reset();
            logEvent(message);
            updateUI();
            simulationTime = 0;
            updateTimeDisplay();
            startSimulation(); // Restart after reset
        });
        
        alertOk.addEventListener('click', () => {
            alertModal.style.display = 'none';
        });
        
        // Clear the status log when first entering
        while (statusLog.firstChild) {
            statusLog.removeChild(statusLog.firstChild);
        }
        
        // Add welcome message
        logEvent("Welcome to the Control Room. Reactor systems ready for operation.");
        
        // Initialize simulation
        initSimulation();
    }
    
    // Setup pause/resume when switching between environments
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Browser tab is hidden, pause simulation
            if (simulationInterval) {
                stopSimulation(false); // Don't log this pause
            }
        } else if (simulatorActive && simulatorContainer.style.display !== 'none') {
            // Browser tab is visible again and simulator is active and showing
            if (!simulationInterval) {
                startSimulation();
            }
        }
    });
    
    // Simulation functions
    function initSimulation() {
        // Start with reactor in standby
        updateUI();
        
        // Start simulation timer
        startSimulation();
    }
    
    function startSimulation() {
        if (simulationInterval) return;
        
        reactor.start();
        logEvent('Reactor simulation started');
        
        simulationInterval = setInterval(() => {
            // Update reactor state
            const status = reactor.update();
            
            // Update UI
            updateUI();
            
            // Update time
            simulationTime += 10; // 10 seconds per tick
            updateTimeDisplay();
            
            // Check faults
            if (status && status.faults) {
                handleFaults(status.faults);
            }
            
            // Check if SCRAM completion
            if (reactor.scramInitiated && reactor.handleScram()) {
                logEvent('SCRAM procedure completed. Reactor in cold shutdown.', 'important');
            }
        }, 1000); // Update every second
    }
    
    function stopSimulation(logStop = true) {
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
            if (logStop) {
                logEvent('Simulation stopped');
            }
        }
    }
    
    // Handle switching back to environment view
    function exitToEnvironment() {
        // Pause simulation but don't stop it entirely
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        
        simulatorContainer.style.display = 'none';
        environmentContainer.style.display = 'block';
    }
    
    function updateUI() {
        // Update gauge displays
        const tempPercentage = (reactor.temperature / reactor.maxTemperature) * 100;
        const pressurePercentage = (reactor.pressure / reactor.maxPressure) * 100;
        const radiationPercentage = (reactor.radiation / reactor.maxRadiation) * 100;
        
        tempGauge.style.height = `${Math.min(100, tempPercentage)}%`;
        pressureGauge.style.height = `${Math.min(100, pressurePercentage)}%`;
        radiationGauge.style.height = `${Math.min(100, radiationPercentage)}%`;
        
        // Set color based on value
        setGaugeColor(tempGauge, tempPercentage);
        setGaugeColor(pressureGauge, pressurePercentage);
        setGaugeColor(radiationGauge, radiationPercentage);
        
        // Update readings
        temperatureDisplay.textContent = reactor.temperature.toFixed(1);
        pressureDisplay.textContent = reactor.pressure.toFixed(2);
        radiationDisplay.textContent = reactor.radiation.toFixed(2);
        
        // Update stats
        powerOutput.textContent = reactor.power.toFixed(1);
        
        // Calculate safety rating
        const tempSafety = Math.max(0, 100 - (reactor.temperature / reactor.maxTemperature * 100));
        const pressureSafety = Math.max(0, 100 - (reactor.pressure / reactor.maxPressure * 100));
        const radiationSafety = Math.max(0, 100 - (reactor.radiation / reactor.maxRadiation * 100));
        
        const overallSafety = Math.min(100, (tempSafety + pressureSafety + radiationSafety) / 3);
        safetyRating.textContent = overallSafety.toFixed(1);
        
        // Update control values to match reactor state
        if (!reactor.scramInitiated) {
            controlRodsSlider.value = reactor.controlRodsLevel;
            coolantFlowSlider.value = reactor.coolantFlowRate;
            controlRodsValue.textContent = `${reactor.controlRodsLevel}%`;
            coolantFlowValue.textContent = `${reactor.coolantFlowRate}%`;
        }
        
        turbineSpeedSlider.value = reactor.turbineSpeed;
        turbineSpeedValue.textContent = `${reactor.turbineSpeed}%`;
    }
    
    function setGaugeColor(gauge, percentage) {
        if (percentage < 50) {
            gauge.style.backgroundColor = '#4caf50'; // Green
        } else if (percentage < 80) {
            gauge.style.backgroundColor = '#ffeb3b'; // Yellow
        } else {
            gauge.style.backgroundColor = '#f44336'; // Red
        }
    }
    
    function updateTimeDisplay() {
        const hours = Math.floor(simulationTime / 3600);
        const minutes = Math.floor((simulationTime % 3600) / 60);
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    function handleFaults(faults) {
        if (!faults || faults.length === 0) return;
        
        faults.forEach(fault => {
            // For critical faults, show alert
            if (fault.type === 'critical') {
                logEvent(`CRITICAL: ${fault.message} (${fault.value.toFixed(2)})`, 'critical');
                showAlert('CRITICAL SYSTEM ALERT', fault.message);
                
                // If we're not currently in the simulator view, flash the control room in the 3D environment
                if (simulatorContainer.style.display === 'none') {
                    const event = new CustomEvent('reactor-critical-fault', { 
                        detail: { message: fault.message, system: fault.system }
                    });
                    document.dispatchEvent(event);
                }
            } else {
                logEvent(`WARNING: ${fault.message} (${fault.value.toFixed(2)})`, 'warning');
            }
        });
    }
    
    function logEvent(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.classList.add(type);
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        statusLog.prepend(logEntry);
        
        // Limit log entries
        if (statusLog.children.length > 100) {
            statusLog.removeChild(statusLog.lastChild);
        }
    }
    
    function showAlert(title, message) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        alertModal.style.display = 'block';
    }
    
    // Add some random events
    function addRandomEvent() {
        // Only add random events if simulation is running
        if (!simulationInterval || !reactor.running) return;
        
        const events = [
            {
                probability: 0.02,
                event: () => {
                    logEvent('Coolant pump fluctuation detected', 'warning');
                    reactor.setCoolantFlow(Math.max(0, reactor.coolantFlowRate - 10));
                }
            },
            {
                probability: 0.01,
                event: () => {
                    logEvent('Control rod mechanism stuck', 'warning');
                    // Control rods stuck for a while
                    const originalValue = reactor.controlRodsLevel;
                    setTimeout(() => {
                        if (reactor.running) {
                            logEvent('Control rod mechanism repaired');
                            reactor.setControlRods(originalValue);
                        }
                    }, 10000);
                }
            },
            {
                probability: 0.005,
                event: () => {
                    logEvent('Sensor malfunction - temperature reading unreliable', 'warning');
                    // Visual effect only - Temperature display flickering
                    const originalText = temperatureDisplay.textContent;
                    const flicker = setInterval(() => {
                        temperatureDisplay.textContent = (Math.random() * 100).toFixed(1);
                    }, 200);
                    
                    setTimeout(() => {
                        clearInterval(flicker);
                        logEvent('Temperature sensor recalibrated');
                        temperatureDisplay.textContent = reactor.temperature.toFixed(1);
                    }, 5000);
                }
            }
        ];
        
        // Check each event probability
        events.forEach(eventObj => {
            if (Math.random() < eventObj.probability && reactor.running) {
                eventObj.event();
            }
        });
    }
    
    // Add custom event listener for emergency situations from environment
    document.addEventListener('environment-emergency', (event) => {
        if (event.detail && event.detail.type === 'earthquake') {
            // Handle earthquake event
            logEvent('ALERT: Seismic activity detected!', 'critical');
            showAlert('SEISMIC EVENT', 'Earthquake detected. Reactor stability may be compromised.');
            
            // Cause control rod fluctuations
            const currentLevel = reactor.controlRodsLevel;
            reactor.setControlRods(Math.max(0, Math.min(100, currentLevel + (Math.random() * 30 - 15))));
            
            // Add some damage
            setTimeout(() => {
                logEvent('WARNING: Coolant system damaged by seismic activity', 'warning');
                reactor.setCoolantFlow(Math.max(20, reactor.coolantFlowRate - 20));
            }, 2000);
        }
    });
    
    // Expose reactor state to environment
    window.getReactorStatus = () => {
        return {
            temperature: reactor.temperature,
            pressure: reactor.pressure,
            radiation: reactor.radiation,
            power: reactor.power,
            safety: parseInt(safetyRating.textContent),
            running: reactor.running
        };
    };
    
    // Add random events every 30 seconds
    setInterval(addRandomEvent, 30000);
});
