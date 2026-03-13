import re
with open("/run/media/bhuvi/Acer/PROJECTS/Placement-Prediction-with-AI-Resume-Optimizer/backend/app/services/resume_service.py", "r") as f:
    text = f.read()

text = text.replace('f"{e.get(\\"degree\\", \\"\\")} {e.get(\\"institution\\", \\"\\")}".lower()', "f\\\"{e.get('degree', '')} {e.get('institution', '')}\\\".lower()")
text = text.replace('f"{e.get(\\"role\\", \\"\\")} {e.get(\\"company\\", \\"\\")}".lower()', "f\\\"{e.get('role', '')} {e.get('company', '')}\\\".lower()")
text = text.replace('\\"', "'")

with open("/run/media/bhuvi/Acer/PROJECTS/Placement-Prediction-with-AI-Resume-Optimizer/backend/app/services/resume_service.py", "w") as f:
    f.write(text)

