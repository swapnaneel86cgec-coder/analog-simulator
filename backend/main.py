from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from models import SignalRequest, SignalResponse, AMRequest, FMRequest
from processor import process_signal, process_am, process_fm

app = FastAPI(title="Analog Signal Simulator API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/simulate", response_model=SignalResponse)
def simulate_signal(request: SignalRequest):
    try:
        result = process_signal(
            expression=request.expression,
            duration=request.duration,
            sample_rate=request.sample_rate
        )
        return SignalResponse(**result)
    except Exception as e:
        # Return error properly
        return SignalResponse(
            time=[],
            amplitude=[],
            fft_freq=[],
            fft_mag=[],
            error=str(e)
        )

@app.post("/api/am", response_model=SignalResponse)
def simulate_am(request: AMRequest):
    try:
        result = process_am(request)
        return SignalResponse(**result)
    except Exception as e:
        return SignalResponse(time=[], fft_freq=[], fft_mag=[], error=str(e))

@app.post("/api/fm", response_model=SignalResponse)
def simulate_fm(request: FMRequest):
    try:
        result = process_fm(request)
        return SignalResponse(**result)
    except Exception as e:
        return SignalResponse(time=[], fft_freq=[], fft_mag=[], error=str(e))

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
