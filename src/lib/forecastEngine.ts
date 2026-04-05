export interface ModelResult {
  name: string;
  predictions: number[];
  mape: number;
  bias: number;
  mae: number;
}

export interface ForecastResult {
  models: ModelResult[];
  bestModel: string;
  horizon: number;
  historicalLength: number;
}

// --- Models ---

function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
  }
  return result;
}

function forecastMA(data: number[], horizon: number, window: number = 3): number[] {
  const extended = [...data];
  for (let i = 0; i < horizon; i++) {
    const slice = extended.slice(-window);
    extended.push(slice.reduce((a, b) => a + b, 0) / window);
  }
  return extended.slice(data.length);
}

function simpleExponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

function forecastSES(data: number[], horizon: number, alpha: number = 0.3): number[] {
  const smoothed = simpleExponentialSmoothing(data, alpha);
  const lastValue = smoothed[smoothed.length - 1];
  return Array(horizon).fill(lastValue);
}

function doubleExponentialSmoothing(data: number[], alpha: number = 0.3, beta: number = 0.2): { level: number[]; trend: number[] } {
  const level = [data[0]];
  const trend = [data.length > 1 ? data[1] - data[0] : 0];

  for (let i = 1; i < data.length; i++) {
    const l = alpha * data[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    const t = beta * (l - level[i - 1]) + (1 - beta) * trend[i - 1];
    level.push(l);
    trend.push(t);
  }
  return { level, trend };
}

function forecastDES(data: number[], horizon: number, alpha: number = 0.3, beta: number = 0.2): number[] {
  const { level, trend } = doubleExponentialSmoothing(data, alpha, beta);
  const lastLevel = level[level.length - 1];
  const lastTrend = trend[trend.length - 1];
  return Array.from({ length: horizon }, (_, i) => lastLevel + (i + 1) * lastTrend);
}

function linearTrend(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (data[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function forecastLinear(data: number[], horizon: number): number[] {
  const { slope, intercept } = linearTrend(data);
  return Array.from({ length: horizon }, (_, i) => intercept + slope * (data.length + i));
}

function weightedMovingAverage(data: number[], horizon: number, window: number = 4): number[] {
  const extended = [...data];
  for (let h = 0; h < horizon; h++) {
    const slice = extended.slice(-window);
    const weights = Array.from({ length: window }, (_, i) => i + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const val = slice.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight;
    extended.push(val);
  }
  return extended.slice(data.length);
}

// --- Metrics ---

function calcMAPE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  return count === 0 ? 0 : (sum / count) * 100;
}

function calcBias(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) {
      sum += (predicted[i] - actual[i]) / actual[i];
      count++;
    }
  }
  return count === 0 ? 0 : (sum / count) * 100;
}

function calcMAE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return 0;
  return actual.slice(0, n).reduce((sum, v, i) => sum + Math.abs(v - predicted[i]), 0) / n;
}

// --- Backtesting ---

function backtest(
  data: number[],
  forecastFn: (trainData: number[], horizon: number) => number[],
  testSize: number
): { mape: number; bias: number; mae: number } {
  const train = data.slice(0, -testSize);
  const test = data.slice(-testSize);
  const predicted = forecastFn(train, testSize);
  return {
    mape: calcMAPE(test, predicted),
    bias: calcBias(test, predicted),
    mae: calcMAE(test, predicted),
  };
}

// --- Optimize alpha for SES ---

function optimizeSES(data: number[], testSize: number): number {
  let bestAlpha = 0.3;
  let bestMAPE = Infinity;
  for (let a = 0.1; a <= 0.9; a += 0.1) {
    const { mape } = backtest(data, (d, h) => forecastSES(d, h, a), testSize);
    if (mape < bestMAPE) {
      bestMAPE = mape;
      bestAlpha = a;
    }
  }
  return bestAlpha;
}

// --- Main ---

export function runAllModels(data: number[], horizon: number): ForecastResult {
  const testSize = Math.max(2, Math.min(Math.floor(data.length * 0.2), horizon));
  const bestAlpha = optimizeSES(data, testSize);

  const modelDefs: { name: string; fn: (d: number[], h: number) => number[] }[] = [
    { name: "Moyenne Mobile (3)", fn: (d, h) => forecastMA(d, h, 3) },
    { name: "Moyenne Mobile Pondérée", fn: (d, h) => weightedMovingAverage(d, h, 4) },
    { name: "Lissage Exponentiel", fn: (d, h) => forecastSES(d, h, bestAlpha) },
    { name: "Lissage Double (Holt)", fn: (d, h) => forecastDES(d, h, 0.3, 0.2) },
    { name: "Tendance Linéaire", fn: forecastLinear },
  ];

  const models: ModelResult[] = modelDefs.map(({ name, fn }) => {
    const bt = backtest(data, fn, testSize);
    const predictions = fn(data, horizon);
    return { name, predictions, mape: bt.mape, bias: bt.bias, mae: bt.mae };
  });

  models.sort((a, b) => a.mape - b.mape);

  return {
    models,
    bestModel: models[0].name,
    horizon,
    historicalLength: data.length,
  };
}
