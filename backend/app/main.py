import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth_router, app_router, phase_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Group Project Accountability Tracker")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(app_router.router, prefix="/api", tags=["App"])
app.include_router(phase_router.router, prefix="/api", tags=["Phases"])

@app.get("/")
def root():
    return {"message": "Welcome to AI Group Project Accountability Tracker API"}



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
