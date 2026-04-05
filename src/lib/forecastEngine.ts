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

// ============================================================
// 1. SES – Simple Exponential Smoothing
// ============================================================
function forecastSES(data: number[], horizon: number, alpha: number = 0.3): number[] {
  let level = data[0];
  for (let i = 1; i < data.length; i++) {
    level = alpha * data[i] + (1 - alpha) * level;
  }
  return Array(horizon).fill(level);
}

// ============================================================
// 2. Holt – Double Exponential Smoothing (trend + damped)
// ============================================================
function forecastHolt(data: number[], horizon: number, alpha = 0.3, beta = 0.2, phi = 0.9): number[] {
  let level = data[0];
  let trend = data.length > 1 ? data[1] - data[0] : 0;
  for (let i = 1; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * data[i] + (1 - alpha) * (prevLevel + phi * trend);
    trend = beta * (level - prevLevel) + (1 - beta) * phi * trend;
  }
  const preds: number[] = [];
  let cumPhi = 0;
  for (let h = 1; h <= horizon; h++) {
    cumPhi += Math.pow(phi, h);
    preds.push(level + cumPhi * trend);
  }
  return preds;
}

// ============================================================
// 3. Holt-Winters – Triple Exponential Smoothing (additive)
// ============================================================
function forecastHoltWinters(data: number[], horizon: number, seasonLength = 12): number[] {
  const m = Math.min(seasonLength, Math.floor(data.length / 2));
  if (data.length < m * 2) return forecastHolt(data, horizon);

  const alpha = 0.3, beta = 0.1, gamma = 0.3;
  // Initialize
  const seasonal: number[] = new Array(data.length + horizon).fill(0);
  let level = data.slice(0, m).reduce((a, b) => a + b, 0) / m;
  let trend = (data.slice(m, 2 * m).reduce((a, b) => a + b, 0) - data.slice(0, m).reduce((a, b) => a + b, 0)) / (m * m);
  for (let i = 0; i < m; i++) seasonal[i] = data[i] - level;

  for (let i = m; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * (data[i] - seasonal[i - m]) + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[i] = gamma * (data[i] - level) + (1 - gamma) * seasonal[i - m];
  }

  const preds: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const sIdx = data.length - m + ((h - 1) % m);
    preds.push(level + h * trend + seasonal[sIdx]);
  }
  return preds;
}

// ============================================================
// 4. Moving Average (MA-3)
// ============================================================
function forecastMA(data: number[], horizon: number, window = 3): number[] {
  const extended = [...data];
  for (let i = 0; i < horizon; i++) {
    const slice = extended.slice(-window);
    extended.push(slice.reduce((a, b) => a + b, 0) / window);
  }
  return extended.slice(data.length);
}

// ============================================================
// 5. Weighted Moving Average (WMA)
// ============================================================
function forecastWMA(data: number[], horizon: number, window = 4): number[] {
  const extended = [...data];
  for (let h = 0; h < horizon; h++) {
    const slice = extended.slice(-window);
    const weights = Array.from({ length: window }, (_, i) => i + 1);
    const totalW = weights.reduce((a, b) => a + b, 0);
    extended.push(slice.reduce((s, v, i) => s + v * weights[i], 0) / totalW);
  }
  return extended.slice(data.length);
}

// ============================================================
// 6. Linear Trend
// ============================================================
function forecastLinear(data: number[], horizon: number): number[] {
  const n = data.length;
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (data[i] - yMean); den += (i - xMean) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return Array.from({ length: horizon }, (_, i) => intercept + slope * (n + i));
}

// ============================================================
// 7. Theta Method (SES + linear drift)
// ============================================================
function forecastTheta(data: number[], horizon: number): number[] {
  const sesAlpha = optimizeAlpha(data, Math.max(2, Math.floor(data.length * 0.2)));
  const sesPreds = forecastSES(data, horizon, sesAlpha);
  const linPreds = forecastLinear(data, horizon);
  return sesPreds.map((s, i) => (s + linPreds[i]) / 2);
}

// ============================================================
// 8. Seasonal Naive (repeat last season)
// ============================================================
function forecastSeasonalNaive(data: number[], horizon: number, seasonLength = 12): number[] {
  const m = Math.min(seasonLength, data.length);
  return Array.from({ length: horizon }, (_, i) => data[data.length - m + (i % m)]);
}

// ============================================================
// 9. ARIMA-like (AR(p) with differencing)
// ============================================================
function forecastARIMA(data: number[], horizon: number): number[] {
  // Simple AR(2) on first-differenced series
  if (data.length < 5) return forecastSES(data, horizon);
  const diff = data.slice(1).map((v, i) => v - data[i]);
  // Estimate AR(2) coefficients via Yule-Walker (simplified)
  const n = diff.length;
  const mean = diff.reduce((a, b) => a + b, 0) / n;
  const centered = diff.map(d => d - mean);

  const r0 = centered.reduce((s, v) => s + v * v, 0) / n;
  const r1 = centered.slice(1).reduce((s, v, i) => s + v * centered[i], 0) / n;
  const r2 = centered.slice(2).reduce((s, v, i) => s + v * centered[i], 0) / n;

  const denom = r0 * r0 - r1 * r1;
  let phi1 = 0.5, phi2 = 0.1;
  if (Math.abs(denom) > 1e-10) {
    phi1 = (r1 * r0 - r2 * r1) / denom;
    phi2 = (r2 * r0 - r1 * r1) / denom;
  }
  // Clamp for stability
  phi1 = Math.max(-0.99, Math.min(0.99, phi1));
  phi2 = Math.max(-0.99, Math.min(0.99, phi2));

  const extended = [...centered];
  for (let h = 0; h < horizon; h++) {
    const val = mean + phi1 * (extended[extended.length - 1]) + phi2 * (extended[extended.length - 2]);
    extended.push(val);
  }

  // Integrate back
  let lastVal = data[data.length - 1];
  const preds: number[] = [];
  for (let h = 0; h < horizon; h++) {
    lastVal += extended[n + h] + mean;
    preds.push(lastVal);
  }
  return preds;
}

// ============================================================
// 10. SARIMA-like (ARIMA + seasonal component)
// ============================================================
function forecastSARIMA(data: number[], horizon: number, seasonLength = 12): number[] {
  const m = Math.min(seasonLength, Math.floor(data.length / 2));
  if (data.length < m * 2) return forecastARIMA(data, horizon);

  // Extract seasonal pattern
  const seasonal: number[] = new Array(m).fill(0);
  const counts: number[] = new Array(m).fill(0);
  for (let i = 0; i < data.length; i++) {
    seasonal[i % m] += data[i];
    counts[i % m]++;
  }
  for (let i = 0; i < m; i++) seasonal[i] /= counts[i];
  const avgSeasonal = seasonal.reduce((a, b) => a + b, 0) / m;
  const seasonalFactors = seasonal.map(s => s - avgSeasonal);

  // Deseasonalize
  const deseasoned = data.map((v, i) => v - seasonalFactors[i % m]);
  // ARIMA on deseasoned
  const arimaPreds = forecastARIMA(deseasoned, horizon);
  // Add seasonal back
  return arimaPreds.map((v, i) => v + seasonalFactors[(data.length + i) % m]);
}

// ============================================================
// 11. Prophet-like (trend + seasonality decomposition)
// ============================================================
function forecastProphet(data: number[], horizon: number, seasonLength = 12): number[] {
  const n = data.length;
  const m = Math.min(seasonLength, Math.floor(n / 2));

  // Linear trend
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (data[i] - yMean); den += (i - xMean) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  // Detrend
  const detrended = data.map((v, i) => v - (intercept + slope * i));

  // Seasonal component (Fourier-like: average by position)
  const seasonal: number[] = new Array(m).fill(0);
  const counts: number[] = new Array(m).fill(0);
  for (let i = 0; i < n; i++) { seasonal[i % m] += detrended[i]; counts[i % m]++; }
  for (let i = 0; i < m; i++) seasonal[i] = counts[i] > 0 ? seasonal[i] / counts[i] : 0;

  return Array.from({ length: horizon }, (_, h) => {
    const trendVal = intercept + slope * (n + h);
    const seasonVal = seasonal[(n + h) % m];
    return trendVal + seasonVal;
  });
}

// ============================================================
// 12. XGBoost-like (lag-based gradient boosting approximation)
// ============================================================
function forecastXGBoost(data: number[], horizon: number): number[] {
  if (data.length < 6) return forecastSES(data, horizon);
  // Build features from lags
  const lagWindow = Math.min(4, data.length - 2);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = lagWindow; i < data.length; i++) {
    X.push(data.slice(i - lagWindow, i));
    y.push(data[i]);
  }

  // Simple gradient boosted stump ensemble (3 rounds)
  const residuals = [...y];
  const stumps: { feature: number; threshold: number; leftVal: number; rightVal: number; lr: number }[] = [];
  const lr = 0.5;

  for (let round = 0; round < 5; round++) {
    let bestGain = -Infinity, bestF = 0, bestT = 0, bestL = 0, bestR = 0;
    for (let f = 0; f < lagWindow; f++) {
      // Try median as threshold
      const vals = X.map(x => x[f]).sort((a, b) => a - b);
      const threshold = vals[Math.floor(vals.length / 2)];
      let leftSum = 0, leftCount = 0, rightSum = 0, rightCount = 0;
      for (let i = 0; i < X.length; i++) {
        if (X[i][f] <= threshold) { leftSum += residuals[i]; leftCount++; }
        else { rightSum += residuals[i]; rightCount++; }
      }
      const leftVal = leftCount > 0 ? leftSum / leftCount : 0;
      const rightVal = rightCount > 0 ? rightSum / rightCount : 0;
      const gain = leftVal * leftVal * leftCount + rightVal * rightVal * rightCount;
      if (gain > bestGain) { bestGain = gain; bestF = f; bestT = threshold; bestL = leftVal; bestR = rightVal; }
    }
    stumps.push({ feature: bestF, threshold: bestT, leftVal: bestL, rightVal: bestR, lr });
    for (let i = 0; i < X.length; i++) {
      const pred = X[i][bestF] <= bestT ? bestL : bestR;
      residuals[i] -= lr * pred;
    }
  }

  // Predict
  const predict = (features: number[]): number => {
    const baseMean = y.reduce((a, b) => a + b, 0) / y.length;
    let val = baseMean;
    for (const s of stumps) {
      val += s.lr * (features[s.feature] <= s.threshold ? s.leftVal : s.rightVal);
    }
    return val;
  };

  const extended = [...data];
  for (let h = 0; h < horizon; h++) {
    const features = extended.slice(-lagWindow);
    extended.push(predict(features));
  }
  return extended.slice(data.length);
}

// ============================================================
// 13. Random Forest-like (ensemble of simple trees)
// ============================================================
function forecastRandomForest(data: number[], horizon: number): number[] {
  if (data.length < 6) return forecastSES(data, horizon);
  const lagWindow = Math.min(4, data.length - 2);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = lagWindow; i < data.length; i++) {
    X.push(data.slice(i - lagWindow, i));
    y.push(data[i]);
  }

  // Build multiple simple trees (stumps) with random feature selection
  const nTrees = 10;
  const trees: { feature: number; threshold: number; leftVal: number; rightVal: number }[] = [];
  const rng = (seed: number) => {
    let s = seed;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  };
  const rand = rng(42);

  for (let t = 0; t < nTrees; t++) {
    // Bootstrap sample
    const indices = Array.from({ length: X.length }, () => Math.floor(rand() * X.length));
    const f = Math.floor(rand() * lagWindow);
    const vals = indices.map(i => X[i][f]).sort((a, b) => a - b);
    const threshold = vals[Math.floor(vals.length / 2)];
    let leftSum = 0, leftCount = 0, rightSum = 0, rightCount = 0;
    for (const i of indices) {
      if (X[i][f] <= threshold) { leftSum += y[i]; leftCount++; }
      else { rightSum += y[i]; rightCount++; }
    }
    trees.push({
      feature: f,
      threshold,
      leftVal: leftCount > 0 ? leftSum / leftCount : 0,
      rightVal: rightCount > 0 ? rightSum / rightCount : 0,
    });
  }

  const predict = (features: number[]) =>
    trees.reduce((s, t) => s + (features[t.feature] <= t.threshold ? t.leftVal : t.rightVal), 0) / nTrees;

  const extended = [...data];
  for (let h = 0; h < horizon; h++) {
    extended.push(predict(extended.slice(-lagWindow)));
  }
  return extended.slice(data.length);
}

// ============================================================
// 14. Gradient Boosting (more rounds, shrinkage)
// ============================================================
function forecastGradientBoosting(data: number[], horizon: number): number[] {
  if (data.length < 6) return forecastSES(data, horizon);
  const lagWindow = Math.min(4, data.length - 2);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = lagWindow; i < data.length; i++) {
    X.push(data.slice(i - lagWindow, i));
    y.push(data[i]);
  }

  const baseMean = y.reduce((a, b) => a + b, 0) / y.length;
  const residuals = y.map(v => v - baseMean);
  const stumps: { feature: number; threshold: number; leftVal: number; rightVal: number }[] = [];
  const lr = 0.3;

  for (let round = 0; round < 8; round++) {
    let bestGain = -Infinity, bestF = 0, bestT = 0, bestL = 0, bestR = 0;
    for (let f = 0; f < lagWindow; f++) {
      const sorted = X.map((x, i) => ({ v: x[f], r: residuals[i] })).sort((a, b) => a.v - b.v);
      const mid = Math.floor(sorted.length / 2);
      const threshold = sorted[mid].v;
      let lS = 0, lC = 0, rS = 0, rC = 0;
      for (const s of sorted) {
        if (s.v <= threshold) { lS += s.r; lC++; } else { rS += s.r; rC++; }
      }
      const lV = lC > 0 ? lS / lC : 0;
      const rV = rC > 0 ? rS / rC : 0;
      const gain = lV * lV * lC + rV * rV * rC;
      if (gain > bestGain) { bestGain = gain; bestF = f; bestT = threshold; bestL = lV; bestR = rV; }
    }
    stumps.push({ feature: bestF, threshold: bestT, leftVal: bestL, rightVal: bestR });
    for (let i = 0; i < X.length; i++) {
      residuals[i] -= lr * (X[i][bestF] <= bestT ? bestL : bestR);
    }
  }

  const predict = (features: number[]) =>
    baseMean + stumps.reduce((s, t) => s + lr * (features[t.feature] <= t.threshold ? t.leftVal : t.rightVal), 0);

  const extended = [...data];
  for (let h = 0; h < horizon; h++) {
    extended.push(predict(extended.slice(-lagWindow)));
  }
  return extended.slice(data.length);
}

// ============================================================
// 15. Ridge Regression (L2 regularized linear on lags)
// ============================================================
function forecastRidge(data: number[], horizon: number): number[] {
  if (data.length < 6) return forecastLinear(data, horizon);
  const lagWindow = Math.min(4, data.length - 2);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = lagWindow; i < data.length; i++) {
    X.push([1, ...data.slice(i - lagWindow, i)]); // bias + lags
    y.push(data[i]);
  }

  const p = lagWindow + 1;
  const lambda = 1.0;
  // XtX + lambda*I
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const Xty: number[] = Array(p).fill(0);
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < p; j++) {
      Xty[j] += X[i][j] * y[i];
      for (let k = 0; k < p; k++) XtX[j][k] += X[i][j] * X[i][k];
    }
  }
  for (let j = 0; j < p; j++) XtX[j][j] += lambda;

  // Solve via Gauss elimination
  const A = XtX.map((row, i) => [...row, Xty[i]]);
  for (let i = 0; i < p; i++) {
    let maxRow = i;
    for (let k = i + 1; k < p; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    if (Math.abs(A[i][i]) < 1e-12) continue;
    for (let k = i + 1; k < p; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j <= p; j++) A[k][j] -= f * A[i][j];
    }
  }
  const w = Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    w[i] = A[i][p];
    for (let j = i + 1; j < p; j++) w[i] -= A[i][j] * w[j];
    w[i] /= Math.abs(A[i][i]) > 1e-12 ? A[i][i] : 1;
  }

  const predict = (features: number[]) => w[0] + features.reduce((s, v, i) => s + v * w[i + 1], 0);

  const extended = [...data];
  for (let h = 0; h < horizon; h++) {
    extended.push(predict(extended.slice(-lagWindow)));
  }
  return extended.slice(data.length);
}

// ============================================================
// 16. LSTM-like (simple recurrent with learned gate)
// ============================================================
function forecastLSTM(data: number[], horizon: number): number[] {
  if (data.length < 6) return forecastSES(data, horizon);
  // Normalize
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const norm = data.map(v => (v - min) / range);

  // Simple recurrent: h_t = tanh(w_h * h_{t-1} + w_x * x_t + b)
  // Train with simple gradient descent
  let wh = 0.5, wx = 0.5, wy = 1.0, b = 0, by = 0;
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, x))));
  const tanh = (x: number) => Math.tanh(x);

  // Forward pass & parameter estimation via moment matching
  const forward = () => {
    let h = 0;
    const outputs: number[] = [];
    for (let i = 0; i < norm.length; i++) {
      h = tanh(wh * h + wx * norm[i] + b);
      outputs.push(wy * h + by);
    }
    return outputs;
  };

  // Simple optimization (grid-like)
  let bestLoss = Infinity;
  let bestParams = { wh, wx, wy, b, by };
  for (let trial = 0; trial < 20; trial++) {
    const seed = trial * 137;
    wh = 0.3 + ((seed * 17) % 100) / 200;
    wx = 0.3 + ((seed * 31) % 100) / 200;
    wy = 0.5 + ((seed * 43) % 100) / 100;
    b = ((seed * 59) % 100 - 50) / 200;
    by = ((seed * 71) % 100 - 50) / 200;

    const out = forward();
    // Use last portion as validation
    let loss = 0;
    for (let i = Math.floor(norm.length * 0.5); i < norm.length; i++) {
      loss += (out[i] - norm[i]) ** 2;
    }
    if (loss < bestLoss) { bestLoss = loss; bestParams = { wh, wx, wy, b, by }; }
  }
  ({ wh, wx, wy, b, by } = bestParams);

  // Generate predictions
  let h = 0;
  for (let i = 0; i < norm.length; i++) h = tanh(wh * h + wx * norm[i] + b);

  const preds: number[] = [];
  let lastInput = norm[norm.length - 1];
  for (let i = 0; i < horizon; i++) {
    h = tanh(wh * h + wx * lastInput + b);
    const out = wy * h + by;
    preds.push(out * range + min);
    lastInput = out;
  }
  return preds;
}

// ============================================================
// Metrics
// ============================================================
function calcMAPE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  let sum = 0, count = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) { sum += Math.abs((actual[i] - predicted[i]) / actual[i]); count++; }
  }
  return count === 0 ? 0 : (sum / count) * 100;
}

function calcBias(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  let sum = 0, count = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) { sum += (predicted[i] - actual[i]) / actual[i]; count++; }
  }
  return count === 0 ? 0 : (sum / count) * 100;
}

function calcMAE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return 0;
  return actual.slice(0, n).reduce((sum, v, i) => sum + Math.abs(v - predicted[i]), 0) / n;
}

// ============================================================
// Backtesting
// ============================================================
function backtest(
  data: number[],
  forecastFn: (d: number[], h: number) => number[],
  testSize: number
): { mape: number; bias: number; mae: number } {
  const train = data.slice(0, -testSize);
  const test = data.slice(-testSize);
  const predicted = forecastFn(train, testSize);
  return { mape: calcMAPE(test, predicted), bias: calcBias(test, predicted), mae: calcMAE(test, predicted) };
}

function optimizeAlpha(data: number[], testSize: number): number {
  let bestAlpha = 0.3, bestMAPE = Infinity;
  for (let a = 0.1; a <= 0.9; a += 0.1) {
    const { mape } = backtest(data, (d, h) => forecastSES(d, h, a), testSize);
    if (mape < bestMAPE) { bestMAPE = mape; bestAlpha = a; }
  }
  return bestAlpha;
}

// ============================================================
// Main: run all 13 models
// ============================================================
export function runAllModels(data: number[], horizon: number): ForecastResult {
  const testSize = Math.max(2, Math.min(Math.floor(data.length * 0.2), horizon));
  const bestAlpha = optimizeAlpha(data, testSize);

  const modelDefs: { name: string; fn: (d: number[], h: number) => number[] }[] = [
    { name: "ARIMA", fn: forecastARIMA },
    { name: "SARIMA", fn: forecastSARIMA },
    { name: "Prophet", fn: forecastProphet },
    { name: "XGBoost", fn: forecastXGBoost },
    { name: "RandomForest", fn: forecastRandomForest },
    { name: "GradientBoosting", fn: forecastGradientBoosting },
    { name: "Ridge", fn: forecastRidge },
    { name: "LSTM", fn: forecastLSTM },
    { name: "SES", fn: (d, h) => forecastSES(d, h, bestAlpha) },
    { name: "Holt", fn: forecastHolt },
    { name: "HoltWinters", fn: forecastHoltWinters },
    { name: "Theta", fn: forecastTheta },
    { name: "SeasonalNaive", fn: forecastSeasonalNaive },
  ];

  const models: ModelResult[] = modelDefs.map(({ name, fn }) => {
    try {
      const bt = backtest(data, fn, testSize);
      const predictions = fn(data, horizon);
      return { name, predictions, mape: bt.mape, bias: bt.bias, mae: bt.mae };
    } catch {
      return { name, predictions: Array(horizon).fill(data[data.length - 1]), mape: 999, bias: 0, mae: 999 };
    }
  });

  models.sort((a, b) => a.mape - b.mape);

  return {
    models,
    bestModel: models[0].name,
    horizon,
    historicalLength: data.length,
  };
}
