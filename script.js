document.addEventListener('DOMContentLoaded', () => {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxLine = document.getElementById('lineChart').getContext('2d');

    const barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Market Cap (in billions)',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    const lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Price', data: [], borderColor: 'rgba(54, 162, 235, 1)', fill: false }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Time (Days)' } },
                y: { title: { display: true, text: 'Price (USD)' }, beginAtZero: false }
            }
        }
    });

    let cachedData = null;
    let lastFetchTime = 0;
    const CACHE_DURATION = 5 * 60 * 1000;

    async function fetchCryptoData() {
        const now = Date.now();
        if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
            return cachedData;
        }

        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true');
            const data = await response.json();
            cachedData = data;
            lastFetchTime = now;

            updateKpis(data);
            populateTable(data);

            updateCharts(null, data);
            return data;
        } catch (error) {
            console.error('Error fetching cryptocurrency data:', error);
        }
    }

    function updateKpis(data) {
        document.getElementById('kpiBtcPrice').textContent = `$${data.bitcoin.usd.toFixed(0)}`;
        document.getElementById('kpiEthPrice').textContent = `$${data.ethereum.usd.toFixed(1)}`;
        document.getElementById('kpiDogePrice').textContent = `$${data.dogecoin.usd.toFixed(4)}`;
        document.getElementById('kpiSolPrice').textContent = `$${data.solana.usd.toFixed(2)}`;
    }

    function populateTable(data) {
        document.getElementById('btcMarketCap').textContent = `$${(data.bitcoin.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('btcPrice').textContent = `$${data.bitcoin.usd.toFixed(2)}`;
        document.getElementById('btcVolume').textContent = `$${(data.bitcoin.usd_24h_vol / 1e9).toFixed(2)}B`;

        document.getElementById('ethMarketCap').textContent = `$${(data.ethereum.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('ethPrice').textContent = `$${data.ethereum.usd.toFixed(2)}`;
        document.getElementById('ethVolume').textContent = `$${(data.ethereum.usd_24h_vol / 1e9).toFixed(2)}B`;

        document.getElementById('dogeMarketCap').textContent = `$${(data.dogecoin.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('dogePrice').textContent = `$${data.dogecoin.usd.toFixed(4)}`;
        document.getElementById('dogeVolume').textContent = `$${(data.dogecoin.usd_24h_vol / 1e9).toFixed(2)}B`;

        document.getElementById('solMarketCap').textContent = `$${(data.solana.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('solPrice').textContent = `$${data.solana.usd.toFixed(2)}`;
        document.getElementById('solVolume').textContent = `$${(data.solana.usd_24h_vol / 1e9).toFixed(2)}B`;
    }

    function updateCharts(selectedCoin, data) {
        if (selectedCoin) {
            const marketCap = data[selectedCoin].usd_market_cap / 1e9;
            const price = data[selectedCoin].usd;

            barChart.data.labels = [selectedCoin];
            barChart.data.datasets[0].data = [marketCap];
            barChart.update();

            lineChart.data.labels = ['Current'];
            lineChart.data.datasets[0].data = [price];
            lineChart.update();
        } else {
            barChart.data.labels = ['Bitcoin', 'Ethereum', 'Dogecoin', 'Solana'];
            barChart.data.datasets[0].data = [
                data.bitcoin.usd_market_cap / 1e9,
                data.ethereum.usd_market_cap / 1e9,
                data.dogecoin.usd_market_cap / 1e9,
                data.solana.usd_market_cap / 1e9
            ];
            barChart.update();

            lineChart.data.labels = ['Bitcoin', 'Ethereum', 'Dogecoin', 'Solana'];
            lineChart.data.datasets[0].data = [
                data.bitcoin.usd,
                data.ethereum.usd,
                data.dogecoin.usd,
                data.solana.usd
            ];
            lineChart.update();
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    async function fetchHistoricalData(coinId) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365`);
            const data = await response.json();
            return data.prices;
        } catch (error) {
            console.error('Error fetching historical data:', error);
            return [];
        }
    }

    function updateLineChart(prices) {
        const labels = prices.map(price => new Date(price[0]).toLocaleDateString());
        const data = prices.map(price => price[1]);

        lineChart.data.labels = labels;
        lineChart.data.datasets[0].data = data;
        lineChart.update();
    }

    document.querySelectorAll('#cryptoTable tbody tr').forEach(row => {
        row.addEventListener('click', debounce(async function () {
            const selectedCoin = this.getAttribute('data-coin');
            const data = await fetchCryptoData();
            updateCharts(selectedCoin, data);

            const historicalPrices = await fetchHistoricalData(selectedCoin);
            updateLineChart(historicalPrices);
        }, 500));
    });

    fetchCryptoData();

    async function fetchCurrentVolumeData() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,solana&vs_currencies=usd&include_24hr_vol=true');
            const data = await response.json();
            console.log('Current volume data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching current volume data:', error);
            return {};
        }
    }

    async function fetchMonthlyVolumeData(coinId) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`);
            const data = await response.json();
            return data.total_volumes;
        } catch (error) {
            console.error('Error fetching monthly volume data:', error);
            return [];
        }
    }

    async function fetchDailyVolumeData(coinId) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=hourly`);
            const data = await response.json();
            return data.total_volumes;
        } catch (error) {
            console.error('Error fetching daily volume data:', error);
            return [];
        }
    }

    async function fetchHourlyVolumeData(coinId) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`);
            const data = await response.json();
            return data.total_volumes;
        } catch (error) {
            console.error('Error fetching hourly volume data:', error);
            return [];
        }
    }

    fetchCurrentVolumeData().then(async volumeData => {
        if (!document.getElementById('drilldownChart')) {
            console.error('Chart container not found');
            return;
        }

        // Prepare monthly data for each coin
        const monthlyData = {
            bitcoin: await fetchMonthlyVolumeData('bitcoin'),
            ethereum: await fetchMonthlyVolumeData('ethereum'),
            dogecoin: await fetchMonthlyVolumeData('dogecoin'),
            solana: await fetchMonthlyVolumeData('solana')
        };

        // Format monthly data for each coin
        const getMonthlySeriesData = (coinData) => {
            return coinData.map(item => {
                const date = new Date(item[0]);
                return {
                    name: date.toLocaleDateString(),
                    y: item[1] / 1e9,
                    drilldown: `daily-${date.getTime()}`
                };
            });
        };

        const chart = Highcharts.chart('drilldownChart', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Cryptocurrency Volume (Last 3 Months)'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                title: {
                    text: 'Volume (in billions)'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f}B'
                    }
                }
            },
            series: [{
                name: 'Cryptocurrencies',
                colorByPoint: true,
                data: [{
                    name: 'Bitcoin',
                    y: volumeData.bitcoin.usd_24h_vol / 1e9,
                    drilldown: 'bitcoin-months'
                }, {
                    name: 'Ethereum',
                    y: volumeData.ethereum.usd_24h_vol / 1e9,
                    drilldown: 'ethereum-months'
                }, {
                    name: 'Dogecoin',
                    y: volumeData.dogecoin.usd_24h_vol / 1e9,
                    drilldown: 'dogecoin-months'
                }, {
                    name: 'Solana',
                    y: volumeData.solana.usd_24h_vol / 1e9,
                    drilldown: 'solana-months'
                }]
            }],
            drilldown: {
                series: [
                    {
                        id: 'bitcoin-months',
                        name: 'Bitcoin Monthly Volume',
                        data: getMonthlySeriesData(monthlyData.bitcoin)
                    },
                    {
                        id: 'ethereum-months',
                        name: 'Ethereum Monthly Volume',
                        data: getMonthlySeriesData(monthlyData.ethereum)
                    },
                    {
                        id: 'dogecoin-months',
                        name: 'Dogecoin Monthly Volume',
                        data: getMonthlySeriesData(monthlyData.dogecoin)
                    },
                    {
                        id: 'solana-months',
                        name: 'Solana Monthly Volume',
                        data: getMonthlySeriesData(monthlyData.solana)
                    }
                ]
            },
            events: {
                drilldown: async function(e) {
                    if (!e.seriesOptions) {
                        const point = e.point;
                        let seriesData;
                        
                        if (point.drilldown.startsWith('daily-')) {
                            const timestamp = point.drilldown.split('-')[1];
                            const coinId = e.point.series.name.toLowerCase().split(' ')[0];
                            const hourlyData = await fetchHourlyVolumeData(coinId);
                            
                            seriesData = hourlyData.map(item => ({
                                name: new Date(item[0]).toLocaleTimeString(),
                                y: item[1] / 1e9
                            }));
                            
                            this.addSeriesAsDrilldown(point, {
                                name: '24 Hour Volume',
                                id: point.drilldown,
                                data: seriesData
                            });
                        }
                    }
                }
            }
        });
    });

    setInterval(async () => {
        const data = await fetchCryptoData();
        if (data) {
            populateTable(data);
            updateCharts(null, data);
        }
    }, 60000);
});

