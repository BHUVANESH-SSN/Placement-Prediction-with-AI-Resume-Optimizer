from fastapi import APIRouter, HTTPException

from app.models.predict_models import PredictRequest, PredictResponse
from app.services.predict_service import run_prediction

predict_router = APIRouter(prefix="/predict", tags=["Placement Prediction"])


@predict_router.post("", response_model=PredictResponse, summary="Predict placement probability")
def predict_placement(body: PredictRequest):
    """
    Run ML inference on a student profile and return:
    - **placement_probability_pct** — likelihood of placement (0-100)
    - **predicted_company_tier** — FAANG / Mid-tier / Mass Recruiter / Not Placed
    - **strengths** — features that positively impact the prediction (SHAP)
    - **gaps** — features that negatively impact the prediction (SHAP)
    - **recommendations** — prioritised action items to improve placement chances
    """
    result = run_prediction(body.model_dump(), top_n=body.top_n or 5)
    return result
