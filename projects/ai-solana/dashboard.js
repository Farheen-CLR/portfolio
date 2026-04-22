// Chart.js configuration and chart management
let priceChart = null;
let marketChart = null;
let trendChart = null;
let signalChart = null;
let correlationChart = null;

// API helper function (API_BASE_URL is defined in app.js)
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

// Chart.js default configuration
Chart.defaults.color = '#B8BCC8';
Chart.defaults.borderColor = '#2A2B38';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing dashboard charts...');
    // Simple initialization after page loads
    setTimeout(() => {
        initializePriceChart();
        initializeMarketChart();
        setupTokenSelector();
        initializeTrendChart();
        initializeSignalChart();
        initializeCorrelationChart();
        initializeSignalAnalysisChart();
        initializeTrendingCorrelationChart();
        loadInitialData();
        console.log('All charts initialized');
    }, 500);
});

// Initialize Price Chart - will be populated with live data
function initializePriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) {
        console.error('Price chart canvas not found');
        return;
    }
    
    // Destroy existing chart if it exists
    if (priceChart && typeof priceChart.destroy === 'function') {
        priceChart.destroy();
    }
    
    priceChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Price (USD)',
                data: [],
                borderColor: '#14F195',
                backgroundColor: 'rgba(20, 241, 149, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#888' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#888', maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
    
    console.log('Price chart initialized');
}

// Initialize Market Overview Chart
function initializeMarketChart() {
    // First, check if we already have a market chart section
    const dashboardView = document.getElementById('dashboard');
    if (!dashboardView) return;
    
    // Find the price chart container
    const priceChartContainer = document.querySelector('.price-chart-container');
    if (!priceChartContainer) return;
    
    // Use existing market chart canvas from HTML
    const ctx = document.getElementById('marketChart');
    if (!ctx) {
        console.error('Market chart canvas not found in HTML');
        return;
    }
    
    // Destroy existing chart if it exists
    if (marketChart && typeof marketChart.destroy === 'function') {
        marketChart.destroy();
    }
    
    // Initialize empty market chart - will be populated with live data
    marketChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Token Prices',
                data: [],
                backgroundColor: [
                    'rgba(20, 241, 149, 0.6)',
                    'rgba(153, 69, 255, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: [
                    'rgba(20, 241, 149, 1)',
                    'rgba(153, 69, 255, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#888' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#888' }
                }
            }
        }
    });
    
    console.log('Market chart initialized');
}

// Load initial data from API
async function loadInitialData() {
    console.log('Loading initial data from API...');
    
    // Load data for default token (SOL)
    const defaultToken = document.getElementById('tokenSelect')?.value || 'SOL';
    
    // Load price chart data
    try {
        const response = await fetchAPI(`/api/token/${defaultToken}/analysis`);
        if (response) {
            console.log('Got token analysis data:', response);
            
            // Update price chart with real data
            if (response.price_history && response.price_history.prices) {
                const hours = 24;
                const labels = response.price_history.timestamps.slice(-hours).map(ts => {
                    const date = new Date(ts);
                    return date.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                });
                const prices = response.price_history.prices.slice(-hours);
                
                if (priceChart) {
                    priceChart.data.labels = labels;
                    priceChart.data.datasets[0].data = prices;
                    priceChart.update();
                    console.log('Price chart updated with live data');
                }
            } else if (response.current_price) {
                // If no history, create data points around current price
                const currentPrice = response.current_price;
                const labels = [];
                const prices = [];
                const now = new Date();
                
                for (let i = 23; i >= 0; i--) {
                    const time = new Date(now - i * 60 * 60 * 1000);
                    labels.push(time.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }));
                    // Generate price variations around current price
                    const variation = (Math.random() - 0.5) * currentPrice * 0.05;
                    prices.push(currentPrice + variation);
                }
                
                if (priceChart) {
                    priceChart.data.labels = labels;
                    priceChart.data.datasets[0].data = prices;
                    priceChart.update();
                    console.log('Price chart updated with generated data around current price');
                }
            }
        }
    } catch (error) {
        console.error('Error loading token data:', error);
    }
    
    // Load market overview data - fetch tokens list
    try {
        const tokensResponse = await fetchAPI('/api/tokens');
        if (tokensResponse && Array.isArray(tokensResponse)) {
            console.log('Got tokens data for market chart:', tokensResponse);
            
            const labels = tokensResponse.map(t => t.symbol);
            const prices = tokensResponse.map(t => t.price);
            
            if (marketChart) {
                marketChart.data.labels = labels;
                marketChart.data.datasets[0].data = prices;
                marketChart.update();
                console.log('Market chart updated with live data');
            }
        }
    } catch (error) {
        console.error('Error loading market overview:', error);
    }
}

// Update price chart with new data
async function updatePriceChart(symbol) {
    if (!priceChart) return;
    
    try {
        // Fetch historical data
        const response = await fetchAPI(`/api/token/${symbol}/analysis`);
        if (!response) return;
        
        // Use price history if available
        let labels = [];
        let prices = [];
        
        if (response.price_history && response.price_history.prices) {
            // Use actual price history from API
            labels = response.price_history.timestamps.slice(-24).map(ts => {
                const date = new Date(ts);
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            });
            prices = response.price_history.prices.slice(-24);
        } else {
            // Generate sample data if no history available
            const hours = 24;
            const basePrice = response.current_price || 100;
            
            for (let i = hours; i >= 0; i--) {
                const date = new Date();
                date.setHours(date.getHours() - i);
                labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
                
                // Simulate price movement
                const randomChange = (Math.random() - 0.5) * 0.05; // ±5% variation
                const price = basePrice * (1 + randomChange);
                prices.push(price);
            }
        }
        
        // Update chart
        priceChart.data.labels = labels;
        priceChart.data.datasets[0].data = prices;
        priceChart.data.datasets[0].label = `${symbol} Price`;
        priceChart.update('active');
        
    } catch (error) {
        console.error('Error updating price chart:', error);
    }
}

// Token selector
function setupTokenSelector() {
    const selector = document.getElementById('tokenSelect');
    if (!selector) return;
    
    selector.addEventListener('change', (e) => {
        updatePriceChart(e.target.value);
        // Update all charts when token changes
        loadTokenAnalysis(e.target.value);
    });
    
    // Load initial chart
    updatePriceChart(selector.value);
    loadTokenAnalysis(selector.value);
}

// Load comprehensive token analysis
async function loadTokenAnalysis(symbol) {
    try {
        // Fetch token analysis
        const response = await fetchAPI(`/api/token/${symbol}/analysis`);
        if (!response) return;
        
        // Update trend chart
        if (response.ai_prediction) {
            updateTrendChart({
                trend: response.ai_prediction.trend || 'neutral',
                confidence: response.ai_prediction.confidence || 0.5
            });
        }
        
        // Fetch and update signals
        const signalResponse = await fetchAPI('/api/signals');
        if (signalResponse) {
            updateSignalChart([{
                data: {
                    recommendation: signalResponse.signal || 'hold'
                }
            }]);
        }
        
        // Update current price display
        const priceDisplay = document.getElementById('currentPrice');
        if (priceDisplay) {
            priceDisplay.textContent = `$${response.current_price.toFixed(4)}`;
        }
        
        // Update 24h change
        const changeDisplay = document.getElementById('priceChange');
        if (changeDisplay && response.price_change_24h !== undefined) {
            const change = response.price_change_24h;
            changeDisplay.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeDisplay.className = change >= 0 ? 'positive' : 'negative';
        }
        
        // Update volume
        const volumeDisplay = document.getElementById('volume24h');
        if (volumeDisplay && response.volume_24h) {
            volumeDisplay.textContent = `$${formatNumber(response.volume_24h)}`;
        }
        
    } catch (error) {
        console.error('Error loading token analysis:', error);
    }
}

// Format number helper
function formatNumber(num) {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

// Trend Analysis Chart - DISABLED to prevent canvas conflicts
function initializeTrendChart() {
    // DISABLED - charts-fixed.js handles this chart
    return;
    
    const ctx = document.getElementById('trendChart');
    if (!ctx || trendChart) return;
    
    trendChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Bullish Signals', 'Bearish Signals', 'Neutral'],
            datasets: [{
                label: 'Signal Strength',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(20, 241, 149, 0.8)',
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(255, 217, 61, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2A2B38',
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Load real data after initialization
    setTimeout(() => loadTrendData(), 1000);
}

// Update trend chart with AI analysis
function updateTrendChart(trendData) {
    if (!trendChart) {
        initializeTrendChart();
    }
    
    if (trendChart && trendData) {
        // Example: Update with trend analysis data
        const bullishScore = trendData.trend === 'bullish' ? trendData.confidence * 100 : 20;
        const bearishScore = trendData.trend === 'bearish' ? trendData.confidence * 100 : 20;
        const neutralScore = trendData.trend === 'neutral' ? trendData.confidence * 100 : 20;
        
        trendChart.data.datasets[0].data = [bullishScore, bearishScore, neutralScore];
        trendChart.update('active');
    }
}

// Signal Distribution Chart - DISABLED to prevent canvas conflicts
function initializeSignalChart() {
    // DISABLED - charts-fixed.js handles this chart
    return;
    
    const ctx = document.getElementById('signalChart');
    if (!ctx || signalChart) return;
    
    signalChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Buy', 'Hold', 'Sell'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(20, 241, 149, 0.8)',
                    'rgba(255, 217, 61, 0.8)',
                    'rgba(255, 107, 107, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${percentage}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Load real data after initialization
    setTimeout(() => loadSignalData(), 1000);
}

// Update signal distribution
function updateSignalChart(signals) {
    if (!signalChart) {
        initializeSignalChart();
    }
    
    if (signalChart && signals) {
        const counts = { buy: 0, hold: 0, sell: 0 };
        
        signals.forEach(signal => {
            const rec = signal.data.recommendation.toLowerCase();
            if (counts.hasOwnProperty(rec)) {
                counts[rec]++;
            }
        });
        
        signalChart.data.datasets[0].data = [counts.buy, counts.hold, counts.sell];
        signalChart.update('active');
    }
}

// Correlation Matrix Chart - DISABLED to prevent canvas conflicts
function initializeCorrelationChart() {
    // DISABLED - charts-fixed.js handles this chart
    return;
    
    const ctx = document.getElementById('correlationChart');
    if (!ctx || correlationChart) return;
    
    // This would typically show a heatmap of token correlations
    // For demo, we'll use a radar chart
    correlationChart = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['SOL', 'USDC', 'RAY', 'SRM', 'BONK'],
            datasets: [{
                label: 'Correlation Strength',
                data: [100, 20, 75, 60, 40],
                borderColor: '#14F195',
                backgroundColor: 'rgba(20, 241, 149, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: '#14F195',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#14F195'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    },
                    grid: {
                        color: '#2A2B38'
                    },
                    pointLabels: {
                        color: '#B8BCC8',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
    
    // Load real data after initialization
    setTimeout(() => loadCorrelationData(), 1000);
}

// Real-time chart updates
function handleRealtimeUpdate(data) {
    if (!priceChart || !data.prices) return;
    
    const selectedToken = document.getElementById('tokenSelect')?.value;
    if (!selectedToken || !data.prices[selectedToken]) return;
    
    const price = data.prices[selectedToken].price;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Add new data point
    if (priceChart.data.labels.length > 24) {
        priceChart.data.labels.shift();
        priceChart.data.datasets[0].data.shift();
    }
    
    priceChart.data.labels.push(time);
    priceChart.data.datasets[0].data.push(price);
    priceChart.update('active');
}

// Signal Analysis Chart for Trading Signals page
function initializeSignalAnalysisChart() {
    const ctx = document.getElementById('signalAnalysisChart');
    if (!ctx) return;
    
    window.signalAnalysisChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'],
            datasets: [{
                label: 'Signal Strength',
                data: [3, 5, 8, 2, 1],
                backgroundColor: [
                    'rgba(20, 241, 149, 0.8)',
                    'rgba(20, 241, 149, 0.6)',
                    'rgba(255, 217, 61, 0.8)',
                    'rgba(255, 107, 107, 0.6)',
                    'rgba(255, 107, 107, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2A2B38'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Trending Correlation Chart for Trending page
function initializeTrendingCorrelationChart() {
    const ctx = document.getElementById('trendingCorrelationChart');
    if (!ctx) return;
    
    window.trendingCorrelationChart = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['SOL', 'USDC', 'RAY', 'SRM', 'BONK'],
            datasets: [{
                label: 'Correlation Strength',
                data: [100, 20, 75, 60, 40],
                borderColor: '#14F195',
                backgroundColor: 'rgba(20, 241, 149, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: '#14F195',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#14F195'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    },
                    grid: {
                        color: '#2A2B38'
                    },
                    pointLabels: {
                        color: '#B8BCC8',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Data loading functions for dashboard charts
async function loadTrendData() {
    try {
        const response = await fetchAPI('/api/token/SOL/analysis');
        const data = await response.json();
        
        if (window.trendChart && data) {
            // Generate trend data based on AI signal and sentiment
            let bullish = 40, bearish = 30, neutral = 30;
            
            if (data.ai_signal === 'BUY' && data.sentiment === 'bullish') {
                bullish = 70; bearish = 15; neutral = 15;
            } else if (data.ai_signal === 'SELL' && data.sentiment === 'bearish') {
                bullish = 10; bearish = 70; neutral = 20;
            } else if (data.sentiment === 'bullish') {
                bullish = 60; bearish = 20; neutral = 20;
            } else if (data.sentiment === 'bearish') {
                bullish = 20; bearish = 60; neutral = 20;
            }
            
            window.trendChart.data.datasets[0].data = [bullish, bearish, neutral];
            window.trendChart.update();
            console.log('Trend analysis chart updated with real data');
        }
    } catch (error) {
        console.log('Using default trend data:', error);
    }
}

async function loadSignalData() {
    try {
        const response = await fetchAPI('/api/signals');
        const data = await response.json();
        
        if (window.signalChart && data && data.signals) {
            // Count signal types from the signals array
            let buyCount = 0, holdCount = 0, sellCount = 0;
            
            data.signals.forEach(signal => {
                if (signal.signal === 'BUY') buyCount++;
                else if (signal.signal === 'SELL') sellCount++;
                else holdCount++;
            });
            
            // Calculate percentages
            const total = data.signals.length;
            const buyPercent = Math.round((buyCount / total) * 100);
            const holdPercent = Math.round((holdCount / total) * 100);
            const sellPercent = Math.round((sellCount / total) * 100);
            
            window.signalChart.data.datasets[0].data = [buyPercent, holdPercent, sellPercent];
            window.signalChart.update();
            console.log('Signal distribution chart updated with real data');
        }
    } catch (error) {
        console.log('Using default signal data:', error);
    }
}

async function loadCorrelationData() {
    try {
        const response = await fetchAPI('/api/correlations');
        const data = await response.json();
        
        if (window.correlationChart && data && data.correlations) {
            // Extract correlation data for visualization
            const tokens = Object.keys(data.correlations);
            const correlationValues = [];
            
            // Get correlation values for the first token with all others
            const baseToken = tokens[0];
            if (data.correlations[baseToken]) {
                tokens.forEach(token => {
                    if (token !== baseToken) {
                        correlationValues.push(Math.abs(data.correlations[baseToken][token] || 0) * 100);
                    }
                });
                
                // Update chart with correlation data
                window.correlationChart.data.labels = tokens.slice(1);
                window.correlationChart.data.datasets[0].data = correlationValues;
                window.correlationChart.update();
                console.log('Market correlation chart updated with real data');
            }
        }
    } catch (error) {
        console.log('Using default correlation data:', error);
    }
}

// Export functions and chart objects for use in app.js
window.chartFunctions = {
    initializePriceChart,
    initializeMarketChart,
    updatePriceChart,
    updateTrendChart,
    updateSignalChart,
    initializeTrendChart,
    initializeSignalChart,
    initializeCorrelationChart,
    initializeSignalAnalysisChart,
    initializeTrendingCorrelationChart,
    handleRealtimeUpdate,
    loadInitialData,
    loadTrendData,
    loadSignalData,
    loadCorrelationData
};

// Export chart objects globally
window.priceChart = priceChart;
window.marketChart = marketChart;
window.trendChart = trendChart;
window.signalChart = signalChart;
window.correlationChart = correlationChart;