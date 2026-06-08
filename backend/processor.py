import sympy as sp
import numpy as np
from scipy.fft import fft, fftfreq
import re

def preprocess_expression(expr: str) -> str:
    """
    Cleans and pre-processes the expression string to make it compatible with SymPy.
    - Handles implied multiplication like '5sin' -> '5*sin'
    - Replaces common math constants e.g. pi
    """
    # Replace common pi symbols
    expr = expr.replace('\\pi', 'pi')
    expr = expr.replace('π', 'pi')
    
    # Remove x(t)= if present
    expr = re.sub(r'^[a-zA-Z]\(t\)\s*=\s*', '', expr)
    
    # Handle implied multiplication before functions or variables, e.g., 5sin -> 5*sin, 2pi -> 2*pi
    # Matches a digit followed by a letter
    expr = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', expr)
    
    return expr

def compute_properties(time_arr, amplitude_arr, freq_arr, mag_arr, yf_pos_complex=None):
    # Amplitude: (max - min) / 2
    amplitude = (np.max(amplitude_arr) - np.min(amplitude_arr)) / 2
    
    # RMS: sqrt(mean(square))
    rms = np.sqrt(np.mean(amplitude_arr**2))
    
    # Frequency: from FFT (find peak frequency ignoring DC offset if needed)
    # We ignore the 0 Hz component for dominant frequency if there's an AC signal
    positive_freq_indices = freq_arr > 0
    pos_freqs = freq_arr[positive_freq_indices]
    pos_mags = mag_arr[positive_freq_indices]
    
    phase_shift = 0.0
    if len(pos_mags) > 0 and np.max(pos_mags) > 1e-5:
        peak_idx = np.argmax(pos_mags)
        frequency = pos_freqs[peak_idx]
        time_period = 1.0 / frequency if frequency > 0 else 0
        
        # Calculate phase shift using complex FFT value at the peak frequency
        if yf_pos_complex is not None and len(mag_arr) > 1:
            # Find peak index in the full positive array ignoring DC (index 0)
            peak_idx_full = np.argmax(mag_arr[1:]) + 1
            peak_complex = yf_pos_complex[peak_idx_full]
            phase_rad = np.angle(peak_complex)
            # Threshold small phases to 0 for cleaner display
            if abs(phase_rad) < 1e-3:
                phase_rad = 0.0
            phase_shift = np.degrees(phase_rad)
    else:
        frequency = 0.0
        time_period = 0.0
        
    return {
        "amplitude": float(amplitude),
        "frequency": float(frequency),
        "time_period": float(time_period),
        "rms": float(rms),
        "phase_shift": float(phase_shift)
    }

def process_signal(expression: str, duration: float, sample_rate: float):
    # Time array
    n_samples = int(duration * sample_rate)
    t_arr = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Preprocess
    clean_expr = preprocess_expression(expression)
    
    # Parse with SymPy
    t = sp.Symbol('t')
    try:
        # We need to evaluate the expression safely
        sympy_expr = sp.sympify(clean_expr)
    except Exception as e:
        raise ValueError(f"Failed to parse expression: {clean_expr}. Error: {str(e)}")
        
    # Lambdify for fast numpy evaluation
    f = sp.lambdify(t, sympy_expr, modules=['numpy'])
    
    # Evaluate
    try:
        amplitude_arr = f(t_arr)
        # Handle constant expressions (lambdify might return a scalar)
        if np.isscalar(amplitude_arr):
            amplitude_arr = np.full_like(t_arr, amplitude_arr)
    except Exception as e:
        raise ValueError(f"Failed to evaluate expression. Error: {str(e)}")
        
    # FFT
    yf = fft(amplitude_arr)
    xf = fftfreq(n_samples, 1 / sample_rate)
    
    # We only want the positive frequencies for display
    positive_freqs = xf >= 0
    
    xf_pos = xf[positive_freqs]
    yf_pos = np.abs(yf[positive_freqs]) / (n_samples / 2.0)
    yf_pos[0] = yf_pos[0] / 2.0 # Correct DC component magnitude
    
    yf_pos_complex = yf[positive_freqs]
    
    props = compute_properties(t_arr, amplitude_arr, xf_pos, yf_pos, yf_pos_complex)
    
    # Subsample data if it's too large to send to frontend to maintain performance
    # For a smooth plot, ~2000 points is usually enough.
    max_points = 2000
    if len(t_arr) > max_points:
        step = len(t_arr) // max_points
        t_arr_sub = t_arr[::step]
        amp_arr_sub = amplitude_arr[::step]
    else:
        t_arr_sub = t_arr
        amp_arr_sub = amplitude_arr
        
    # Subsample FFT too (only up to say 10x the dominant frequency or limit to max_points)
    if len(xf_pos) > max_points:
        # just sample evenly, or maybe we want the first max_points because higher freqs are often 0
        xf_pos_sub = xf_pos[:max_points]
        yf_pos_sub = yf_pos[:max_points]
    else:
        xf_pos_sub = xf_pos
        yf_pos_sub = yf_pos

    return {
        "time": t_arr_sub.tolist(),
        "amplitude": amp_arr_sub.tolist(),
        "fft_freq": xf_pos_sub.tolist(),
        "fft_mag": yf_pos_sub.tolist(),
        "properties": props
    }

def add_awgn(signal, snr_db):
    if snr_db is None:
        return signal
    # Calculate signal power and convert to dB
    sig_avg_watts = np.mean(signal**2)
    sig_avg_db = 10 * np.log10(sig_avg_watts + 1e-12)
    # Calculate noise power
    noise_avg_db = sig_avg_db - snr_db
    noise_avg_watts = 10 ** (noise_avg_db / 10)
    # Generate an array of noise
    mean_noise = 0
    noise = np.random.normal(mean_noise, np.sqrt(noise_avg_watts), len(signal))
    return signal + noise

def envelope_detector(signal, sample_rate, rc_constant):
    if rc_constant is None or rc_constant <= 0:
        return np.maximum(signal, 0)
    
    T_s = 1.0 / sample_rate
    alpha = np.exp(-T_s / rc_constant)
    
    rectified = np.maximum(signal, 0)
    envelope = np.zeros_like(rectified)
    
    envelope[0] = rectified[0]
    for i in range(1, len(rectified)):
        envelope[i] = max(rectified[i], envelope[i-1] * alpha)
        
    return envelope

def generate_message(t_arr, amp, freq, waveform):
    if waveform == "square":
        from scipy.signal import square
        return amp * square(2 * np.pi * freq * t_arr)
    elif waveform == "triangle":
        from scipy.signal import sawtooth
        return amp * sawtooth(2 * np.pi * freq * t_arr, 0.5)
    else:
        return amp * np.cos(2 * np.pi * freq * t_arr)

def process_am(req):
    t_arr = np.linspace(0, req.duration, int(req.duration * req.sample_rate), endpoint=False)
    message = generate_message(t_arr, req.message_amp, req.message_freq, req.waveform)
    carrier = np.cos(2 * np.pi * req.carrier_freq * t_arr)
    
    # Generate the appropriate AM signal based on am_type
    if req.am_type == "dsb-sc":
        am_signal = req.carrier_amp * message * carrier
        overmodulated = False
    elif req.am_type == "ssb-sc":
        from scipy.signal import hilbert
        # Analytical signal: msg_analytic = m(t) + j * m_hat(t)
        msg_analytic = hilbert(message)
        msg_hat = np.imag(msg_analytic)
        # USB: m(t)*cos(wct) - m_hat(t)*sin(wct)
        am_signal = req.carrier_amp * (message * carrier - msg_hat * np.sin(2 * np.pi * req.carrier_freq * t_arr))
        overmodulated = False
    elif req.am_type == "vsb":
        # Approximate VSB using a low-pass filter on DSB-SC
        # We want to keep one sideband and a vestige of the other
        from scipy.signal import butter, lfilter
        dsb_sc = req.carrier_amp * message * carrier
        # Design a Butterworth filter centered slightly off carrier
        # For a simple VSB demonstration, we'll just apply a low-pass that cuts halfway through the USB
        nyq = 0.5 * req.sample_rate
        cutoff = (req.carrier_freq + 0.2 * req.message_freq) / nyq
        if cutoff < 1.0:
            b, a = butter(4, cutoff, btype='low')
            am_signal = lfilter(b, a, dsb_sc)
        else:
            am_signal = dsb_sc
        overmodulated = False
    else:
        # Default: DSB-FC (Full Carrier)
        am_signal = (req.carrier_amp + req.modulation_index * req.carrier_amp * (message / req.message_amp if req.message_amp > 0 else 0)) * carrier
        overmodulated = req.modulation_index > 1.0

    if req.snr is not None:
        am_signal = add_awgn(am_signal, req.snr)
        
    demodulated = envelope_detector(am_signal, req.sample_rate, req.rc_constant)
    
    n_samples = len(t_arr)
    yf = fft(am_signal)
    xf = fftfreq(n_samples, 1 / req.sample_rate)
    positive_freqs = xf >= 0
    xf_pos = xf[positive_freqs]
    yf_pos = np.abs(yf[positive_freqs]) / (n_samples / 2.0)
    yf_pos[0] = yf_pos[0] / 2.0
    
    max_points = 2000
    if len(t_arr) > max_points:
        step = len(t_arr) // max_points
        t_arr_sub = t_arr[::step]
        am_sig_sub = am_signal[::step]
        msg_sub = message[::step]
        carrier_sub = (req.carrier_amp * carrier)[::step]
        demod_sub = demodulated[::step]
    else:
        t_arr_sub = t_arr
        am_sig_sub = am_signal
        msg_sub = message
        carrier_sub = req.carrier_amp * carrier
        demod_sub = demodulated
        
    if len(xf_pos) > max_points:
        xf_pos_sub = xf_pos[:max_points]
        yf_pos_sub = yf_pos[:max_points]
    else:
        xf_pos_sub = xf_pos
        yf_pos_sub = yf_pos

    props = compute_properties(t_arr, am_signal, xf_pos, yf_pos)
        
    return {
        "time": t_arr_sub.tolist(),
        "traces": [
            {"name": "Modulated Signal", "y": am_sig_sub.tolist(), "style": "solid", "color": "#00ff00"},
            {"name": "Original Message", "y": msg_sub.tolist(), "style": "dash", "color": "#1e90ff"},
            {"name": "Carrier Signal", "y": carrier_sub.tolist(), "style": "dash", "color": "#aaaaaa"},
            {"name": "Demodulated Envelope", "y": demod_sub.tolist(), "style": "solid", "color": "#ff00ff"}
        ],
        "fft_freq": xf_pos_sub.tolist(),
        "fft_mag": yf_pos_sub.tolist(),
        "properties": props,
        "overmodulated": overmodulated,
        "audio_message": message.tolist(),
        "audio_demodulated": demodulated.tolist()
    }

def process_fm(req):
    t_arr = np.linspace(0, req.duration, int(req.duration * req.sample_rate), endpoint=False)
    message = generate_message(t_arr, req.message_amp, req.message_freq, req.waveform)
    
    # For FM, we integrate the message signal to get phase.
    # If the message is a sine wave: integral of cos is sin.
    # For arbitrary message, we can numerically integrate it.
    phase = np.cumsum(message) * (1.0 / req.sample_rate)
    
    beta_factor = req.freq_deviation / req.message_amp if req.message_amp > 0 else 0
    carrier = np.cos(2 * np.pi * req.carrier_freq * t_arr)
    fm_signal = req.carrier_amp * np.cos(2 * np.pi * req.carrier_freq * t_arr + 2 * np.pi * beta_factor * phase)
    
    overmodulated = False # No strict overmodulation limit for FM like AM, but we can leave it false
    
    if req.snr is not None:
        fm_signal = add_awgn(fm_signal, req.snr)
        
    # Basic FM Demodulation (Derivative + Envelope Detection)
    # y(t) = d/dt [fm_signal]
    diff_fm = np.diff(fm_signal)
    diff_fm = np.append(diff_fm, diff_fm[-1]) # Keep length same
    # Envelope detect the derivative
    demodulated = envelope_detector(diff_fm, req.sample_rate, rc_constant=0.001)
    # Remove DC offset to get zero-centered message estimate
    demodulated = demodulated - np.mean(demodulated)
    # Scale to match original message roughly for visual purposes
    if np.max(np.abs(demodulated)) > 0:
        demodulated = demodulated * (req.message_amp / np.max(np.abs(demodulated)))

    n_samples = len(t_arr)
    yf = fft(fm_signal)
    xf = fftfreq(n_samples, 1 / req.sample_rate)
    positive_freqs = xf >= 0
    xf_pos = xf[positive_freqs]
    yf_pos = np.abs(yf[positive_freqs]) / (n_samples / 2.0)
    yf_pos[0] = yf_pos[0] / 2.0
    
    max_points = 2000
    if len(t_arr) > max_points:
        step = len(t_arr) // max_points
        t_arr_sub = t_arr[::step]
        fm_sig_sub = fm_signal[::step]
        msg_sub = message[::step]
        carrier_sub = (req.carrier_amp * carrier)[::step]
        demod_sub = demodulated[::step]
    else:
        t_arr_sub = t_arr
        fm_sig_sub = fm_signal
        msg_sub = message
        carrier_sub = req.carrier_amp * carrier
        demod_sub = demodulated
        
    if len(xf_pos) > max_points:
        xf_pos_sub = xf_pos[:max_points]
        yf_pos_sub = yf_pos[:max_points]
    else:
        xf_pos_sub = xf_pos
        yf_pos_sub = yf_pos

    props = compute_properties(t_arr, fm_signal, xf_pos, yf_pos)
        
    return {
        "time": t_arr_sub.tolist(),
        "traces": [
            {"name": "Modulated Signal", "y": fm_sig_sub.tolist(), "style": "solid", "color": "#00ff00"},
            {"name": "Original Message", "y": msg_sub.tolist(), "style": "dash", "color": "#1e90ff"},
            {"name": "Carrier Signal", "y": carrier_sub.tolist(), "style": "dash", "color": "#aaaaaa"},
            {"name": "Demodulated Signal", "y": demod_sub.tolist(), "style": "solid", "color": "#ff00ff"}
        ],
        "fft_freq": xf_pos_sub.tolist(),
        "fft_mag": yf_pos_sub.tolist(),
        "properties": props,
        "overmodulated": overmodulated,
        "audio_message": message.tolist(),
        "audio_demodulated": demodulated.tolist()
    }
