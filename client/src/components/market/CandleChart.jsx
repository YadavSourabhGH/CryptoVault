import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useMarketStore } from '../../store/marketStore';
import { useCandles } from '../../hooks/useCandles';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function CandleChart() {
  const selectedPair = useMarketStore((state) => state.selectedPair);
  const [interval, setIntervalVal] = useState('1m');
  const { candles, isLoading } = useCandles(selectedPair, interval);
  
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const lastLoadedRef = useRef(null);

  const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Reset lastLoadedRef when chart is recreated
    lastLoadedRef.current = null;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E11' },
        textColor: '#848E9C',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: '#1E2026' },
        horzLines: { color: '#1E2026' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: '#848E9C',
          width: 0.5,
          style: 3, // Dashed
          labelBackgroundColor: '#1E2026',
        },
        horzLine: {
          color: '#848E9C',
          width: 0.5,
          style: 3,
          labelBackgroundColor: '#1E2026',
        },
      },
      timeScale: {
        borderColor: '#2B2F36',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 6,
        minBarSpacing: 1,
      },
      rightPriceScale: {
        borderColor: '#2B2F36',
        autoScale: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: 380,
    });

    // Add Candlestick Series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderUpColor: '#0ECB81',
      borderDownColor: '#F6465D',
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
    });

    // Add Volume Series
    const volumeSeries = chart.addHistogramSeries({
      color: '#2B2F36',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume', // Set custom overlay scale ID to prevent volume values from showing on the price axis
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8, // Volume histogram at the bottom 20%
        bottom: 0,
      },
    });

    // Configure default right price scale margins for candlesticks
    chart.priceScale('right').applyOptions({
      scaleMargins: {
        top: 0.12, // Keep margin at top
        bottom: 0.25, // Keep margin at bottom to avoid overlapping with volume bars
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize Handler
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedPair]); // Recreate chart if pair changes to clear view cleanly

  // Update chart data whenever candles stream changes
  useEffect(() => {
    if (candles.length > 0 && candlestickSeriesRef.current && volumeSeriesRef.current) {
      candlestickSeriesRef.current.setData(candles);

      const volumeData = candles.map((c) => ({
        time: c.time,
        value: c.volume || 0.001,
        color: c.close >= c.open ? 'rgba(14, 203, 129, 0.15)' : 'rgba(246, 70, 93, 0.15)',
      }));
      volumeSeriesRef.current.setData(volumeData);
      
      const currentKey = `${selectedPair}-${interval}`;
      if (lastLoadedRef.current !== currentKey) {
        lastLoadedRef.current = currentKey;
        
        // Show last 80 candles to avoid compressing 500+ candles into one tiny line
        const total = candles.length;
        const visibleCount = Math.min(total, 80);
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: total - visibleCount,
          to: total + 3, // creates a margin on the right
        });
      }
    }
  }, [candles, selectedPair, interval]);

  return (
    <div className="flex flex-col bg-bg-1 p-2 w-full select-none select-none">
      {/* Interval Toolbar */}
      <div className="flex items-center space-x-2 border-b border-border/40 pb-2 mb-2">
        <span className="text-[10px] uppercase font-bold text-text-secondary pr-2">Interval:</span>
        {intervals.map((int) => (
          <button
            key={int}
            onClick={() => setIntervalVal(int)}
            className={`px-2 py-0.5 rounded text-xs font-semibold font-sans transition-colors ${
              interval === int ? 'bg-bg-3 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-2'
            }`}
          >
            {int}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div className="relative w-full h-[380px] bg-bg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/85 z-10">
            <LoadingSpinner />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
export default CandleChart;
