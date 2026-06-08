from pydantic import BaseModel
from typing import List, Optional

class SignalRequest(BaseModel):
    expression: str
    duration: float = 0.1 # default 100ms
    sample_rate: float = 10000.0 # default 10kHz

class AMRequest(BaseModel):
    am_type: str = "dsb-fc"
    message_amp: float = 1.0
    message_freq: float = 10.0
    waveform: str = "sine"
    carrier_amp: float = 1.0
    carrier_freq: float = 100.0
    modulation_index: float = 1.0
    snr: Optional[float] = None
    rc_constant: Optional[float] = 0.001
    duration: float = 0.1
    sample_rate: float = 10000.0

class FMRequest(BaseModel):
    message_amp: float = 1.0
    message_freq: float = 10.0
    waveform: str = "sine"
    carrier_amp: float = 1.0
    carrier_freq: float = 100.0
    freq_deviation: float = 50.0
    snr: Optional[float] = None
    duration: float = 0.1
    sample_rate: float = 10000.0

class Trace(BaseModel):
    name: str
    y: List[float]
    style: str = "solid"
    color: str = "#00ff00"

class SignalProperties(BaseModel):
    amplitude: float
    frequency: float
    time_period: float
    rms: float
    phase_shift: Optional[float] = 0.0

class SignalResponse(BaseModel):
    time: List[float]
    amplitude: Optional[List[float]] = None
    traces: Optional[List[Trace]] = None
    fft_freq: List[float]
    fft_mag: List[float]
    properties: Optional[SignalProperties] = None
    overmodulated: Optional[bool] = False
    error: Optional[str] = None
    audio_message: Optional[List[float]] = None
    audio_demodulated: Optional[List[float]] = None
