from PIL import Image
from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

# Initialize the image classification pipeline (using a lightweight model)
# This will download once and then be cached.
try:
    classifier = pipeline("image-classification", model="google/mobilenet_v2_1.0_224")
except Exception as e:
    logger.error(f"Failed to load image classifier: {e}")
    classifier = None

def analyze_image_content(image_path: str) -> str:
    """
    Analyzes an image and returns top labels to help AI understand if it's relevant.
    Example: "diagram, flowchart, website, user interface"
    """
    if not classifier:
        return "Image analysis unavailable (model load error)."
    
    try:
        results = classifier(image_path)
        # Extract labels with a confidence threshold
        labels = [res['label'] for res in results if res['score'] > 0.1]
        return ", ".join(labels)
    except Exception as e:
        logger.error(f"Error analyzing image {image_path}: {e}")
        return f"Error analyzing image: {str(e)}"
