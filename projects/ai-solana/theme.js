// Theme Management System
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.querySelector('.theme-icon');
        this.init();
    }

    init() {
        // Apply saved theme on load
        this.applyTheme(this.theme);
        
        // Setup theme toggle button
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Update chart colors when theme changes
        this.setupChartThemeUpdates();
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.theme);
        localStorage.setItem('theme', this.theme);
        
        // Update all charts with new theme colors
        this.updateChartsTheme();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
        
        // Update Chart.js default colors
        if (typeof Chart !== 'undefined') {
            const isDark = theme === 'dark';
            Chart.defaults.color = isDark ? '#B8BCC8' : '#4A5568';
            Chart.defaults.borderColor = isDark ? '#2A2B38' : '#E2E8F0';
        }
    }

    updateChartsTheme() {
        const isDark = this.theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#888' : '#718096';
        
        // Update all existing charts
        const charts = [
            window.mainPriceChart,
            window.mainMarketChart,
            window.mainTrendChart,
            window.mainSignalChart,
            window.mainCorrelationChart,
            window.analysisTrendChart,
            window.signalAnalysisChartObj,
            window.trendingCorrelationChartObj
        ];
        
        charts.forEach(chart => {
            if (chart) {
                // Update grid colors
                if (chart.options.scales) {
                    Object.values(chart.options.scales).forEach(scale => {
                        if (scale.grid) {
                            scale.grid.color = gridColor;
                        }
                        if (scale.ticks) {
                            scale.ticks.color = textColor;
                        }
                        if (scale.pointLabels) {
                            scale.pointLabels.color = textColor;
                        }
                    });
                }
                
                // Update legend colors
                if (chart.options.plugins && chart.options.plugins.legend) {
                    if (chart.options.plugins.legend.labels) {
                        chart.options.plugins.legend.labels.color = textColor;
                    }
                }
                
                // Apply updates
                chart.update();
            }
        });
    }

    setupChartThemeUpdates() {
        // Override Chart.js tooltip defaults based on theme
        if (typeof Chart !== 'undefined') {
            const originalTooltipDefaults = Chart.defaults.plugins.tooltip;
            
            Chart.defaults.plugins.tooltip = {
                ...originalTooltipDefaults,
                backgroundColor: () => this.theme === 'dark' ? '#1E1F2B' : '#FFFFFF',
                titleColor: () => this.theme === 'dark' ? '#FFFFFF' : '#1A1B26',
                bodyColor: () => this.theme === 'dark' ? '#B8BCC8' : '#4A5568',
                borderColor: () => this.theme === 'dark' ? '#2A2B38' : '#E2E8F0',
                borderWidth: 1
            };
        }
    }

    // Get current theme colors for charts
    getChartColors() {
        const isDark = this.theme === 'dark';
        return {
            green: isDark ? '#14F195' : '#00C896',
            purple: isDark ? '#9945FF' : '#7C3AED',
            red: isDark ? '#FF4444' : '#EF4444',
            yellow: isDark ? '#FFD93D' : '#F59E0B',
            gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            textColor: isDark ? '#888' : '#718096'
        };
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for use in other scripts
window.ThemeManager = ThemeManager;